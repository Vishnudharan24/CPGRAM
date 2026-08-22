from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.enums import ActorRole, GrievanceStatus, UserRole, WindowType
from app.deps import get_db, require_role
from app.models.atr import ATR
from app.models.grievance import Grievance
from app.models.grievance_event import GrievanceEvent
from app.schemas.grievance import ATRCreate, AppealDecision, GrievanceDetail
from app.services.atr_quality_check import assess_atr
from app.services.sla_engine import close_window
from app.routers.grievances import _load_grievance

router = APIRouter(prefix="/grievances", tags=["officers"])


@router.post("/{grievance_id}/atr", response_model=GrievanceDetail)
def file_atr(grievance_id: UUID, payload: ATRCreate, db: Session = Depends(get_db), user=Depends(require_role(UserRole.officer, UserRole.admin))):
    grievance = db.get(Grievance, grievance_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    quality = assess_atr(payload.content)
    atr = ATR(grievance_id=grievance.id, officer_id=user.id, content=payload.content, quality_flag=quality)
    db.add(atr)
    grievance.status = GrievanceStatus.resolved if payload.mark_resolved else GrievanceStatus.atr_filed
    if payload.mark_resolved:
        close_window(db, grievance.id, WindowType.resolution)
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="atr_filed", actor_role=ActorRole.officer, payload={"quality_flag": quality.value, "marked_resolved": payload.mark_resolved}))
    db.commit()
    return _load_grievance(db, grievance.id)


@router.post("/{grievance_id}/appeal/decision", response_model=GrievanceDetail)
def decide_appeal(grievance_id: UUID, payload: AppealDecision, db: Session = Depends(get_db), user=Depends(require_role(UserRole.officer, UserRole.admin))):
    grievance = db.get(Grievance, grievance_id)
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
    grievance.appeal_decision = payload.decision
    grievance.status = GrievanceStatus.appeal_resolved
    close_window(db, grievance.id, WindowType.appeal)
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="appeal_resolved", actor_role=ActorRole.officer, payload={"decision": payload.decision}))
    db.commit()
    return _load_grievance(db, grievance.id)
