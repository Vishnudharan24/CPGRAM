from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.enums import ActorRole, GrievanceStatus, Rating, UserRole, WindowType
from app.deps import get_db, require_role
from app.models.grievance import Grievance
from app.models.grievance_event import GrievanceEvent
from app.models.user import User
from app.schemas.grievance import AppealRequest, ClassificationRequest, ClassificationResponse, GrievanceCreate, GrievanceDetail, GrievanceListItem, OrganizationRead, RateRequest
from app.services.classifier import classify_description
from app.services.routing_engine import choose_starting_department, route_grievance
from app.services.sla_engine import open_appeal_window, open_resolution_window
from app.services.organizations import organization_by_code, organization_options

router = APIRouter(prefix="/grievances", tags=["grievances"])


def _load_grievance(db: Session, grievance_id: UUID) -> Grievance | None:
    return db.scalar(
        select(Grievance)
        .options(
            selectinload(Grievance.current_department),
            selectinload(Grievance.events).selectinload(GrievanceEvent.from_department),
            selectinload(Grievance.events).selectinload(GrievanceEvent.to_department),
            selectinload(Grievance.atrs),
            selectinload(Grievance.review_windows),
        )
        .where(Grievance.id == grievance_id)
    )


def _ensure_owner_or_staff(grievance: Grievance, user: User):
    if user.role == UserRole.citizen and grievance.citizen_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grievance not found")


@router.post("/classify", response_model=ClassificationResponse)
def classify(payload: ClassificationRequest, _user: User = Depends(require_role(UserRole.citizen, UserRole.admin))):
    result = classify_description(payload.description)
    return ClassificationResponse(**result.__dict__)


@router.get("/organizations", response_model=list[OrganizationRead])
def list_organizations(_user: User = Depends(require_role(UserRole.citizen, UserRole.admin))):
    return organization_options()


@router.post("", response_model=GrievanceDetail, status_code=status.HTTP_201_CREATED)
def create_grievance(payload: GrievanceCreate, db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.citizen, UserRole.admin))):
    count = db.scalar(select(func.count(Grievance.id))) or 0
    registration_id = f"CPG-{datetime.utcnow().year}-{count + 1:06d}"
    starting_department = choose_starting_department(db, payload.raw_description)
    if not starting_department:
        raise HTTPException(status_code=500, detail="No departments seeded")
    organization = organization_by_code(payload.organization_code)
    if not organization:
        raise HTTPException(status_code=400, detail="Invalid organisation selected")
    grievance = Grievance(
        registration_id=registration_id,
        citizen_id=user.id,
        current_department_id=starting_department.id,
        raw_description=payload.raw_description,
        organization_name=organization["name"],
        organization_code=organization["code"],
        category=payload.category,
        category_code=payload.category_code,
        parent_category_code=payload.parent_category_code,
        category_name=payload.category_name,
        category_path=payload.category_path,
        category_stage=payload.category_stage,
        field_set_id=payload.field_set_id,
        category_input_values=payload.category_input_values,
        destination_routing_codes=payload.destination_routing_codes,
        status=GrievanceStatus.submitted,
    )
    db.add(grievance)
    db.flush()
    classification = classify_description(payload.raw_description)
    db.add(
        GrievanceEvent(
            grievance_id=grievance.id,
            event_type="classification_suggested",
            actor_role=ActorRole.system,
            payload={
                "category": classification.category.value,
                "confidence": classification.confidence,
                "reasoning": classification.reasoning,
                "matched_terms": classification.matched_terms,
            },
        )
    )
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="submitted", to_department_id=starting_department.id, actor_role=ActorRole.citizen, payload={"confirmed_category": payload.category.value}))
    route_grievance(db, grievance, starting_department)
    grievance.status = GrievanceStatus.routed
    open_resolution_window(db, grievance.id)
    db.commit()
    return _load_grievance(db, grievance.id)


@router.get("", response_model=list[GrievanceListItem])
def list_grievances(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.citizen, UserRole.officer, UserRole.admin))):
    stmt = select(Grievance).options(selectinload(Grievance.current_department), selectinload(Grievance.review_windows)).order_by(Grievance.updated_at.desc())
    if user.role == UserRole.citizen:
        stmt = stmt.where(Grievance.citizen_id == user.id)
    return db.scalars(stmt).all()


@router.get("/{grievance_id}", response_model=GrievanceDetail)
def get_grievance(grievance_id: UUID, db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.citizen, UserRole.officer, UserRole.admin))):
    grievance = _load_grievance(db, grievance_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    _ensure_owner_or_staff(grievance, user)
    return grievance


@router.post("/{grievance_id}/rate", response_model=GrievanceDetail)
def rate_grievance(grievance_id: UUID, payload: RateRequest, db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.citizen, UserRole.admin))):
    grievance = _load_grievance(db, grievance_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    _ensure_owner_or_staff(grievance, user)
    grievance.citizen_rating = payload.rating
    if payload.rating == Rating.poor:
        grievance.status = GrievanceStatus.appeal_open
        open_appeal_window(db, grievance.id)
    else:
        grievance.status = GrievanceStatus.closed
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="rated", actor_role=ActorRole.citizen, payload={"rating": payload.rating.value}))
    db.commit()
    return _load_grievance(db, grievance.id)


@router.post("/{grievance_id}/appeal", response_model=GrievanceDetail)
def file_appeal(grievance_id: UUID, payload: AppealRequest, db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.citizen, UserRole.admin))):
    grievance = _load_grievance(db, grievance_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    _ensure_owner_or_staff(grievance, user)
    if grievance.status != GrievanceStatus.appeal_open:
        raise HTTPException(status_code=400, detail="Appeal is available after a Poor rating")
    grievance.appeal_text = payload.text
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="appeal_filed", actor_role=ActorRole.citizen, payload={"text": payload.text}))
    db.commit()
    return _load_grievance(db, grievance.id)
