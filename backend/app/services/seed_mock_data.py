from datetime import timedelta

from sqlalchemy import select

from app.core.enums import ActorRole, DepartmentLevel, GrievanceCategory, GrievanceStatus, Rating, UserRole, WindowStatus, WindowType
from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models.atr import ATR
from app.models.department import Department
from app.models.grievance import Grievance
from app.models.grievance_event import GrievanceEvent
from app.models.review_window import ReviewWindow
from app.models.user import User
from app.services.atr_quality_check import assess_atr
from app.services.sla_engine import utcnow


def get_or_create_user(db, email: str, name: str, role: UserRole):
    user = db.scalar(select(User).where(User.email == email))
    if user:
        return user
    user = User(name=name, email=email, role=role, phone="9999999999", hashed_password=hash_password("password"))
    db.add(user)
    db.flush()
    return user


def get_or_create_department(db, name: str, level: DepartmentLevel, parent: Department | None = None):
    department = db.scalar(select(Department).where(Department.name == name))
    if department:
        return department
    department = Department(name=name, level=level, parent_department_id=parent.id if parent else None)
    db.add(department)
    db.flush()
    return department


def create_seed_grievance(db, citizen, registration_id, description, category, status, department, days_ago=1, rating=None, atr_text=None, appeal=False):
    existing = db.scalar(select(Grievance).where(Grievance.registration_id == registration_id))
    if existing:
        return existing
    now = utcnow()
    created = now - timedelta(days=days_ago)
    grievance = Grievance(
        registration_id=registration_id,
        citizen_id=citizen.id,
        current_department_id=department.id,
        raw_description=description,
        organization_name="Public Services Ministry",
        organization_code="PUBLIC",
        category=category,
        status=status,
        citizen_rating=rating,
        created_at=created,
        updated_at=created,
    )
    db.add(grievance)
    db.flush()
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="submitted", to_department_id=department.id, actor_role=ActorRole.citizen, payload={"seeded": True}, created_at=created))
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="routed_to_district_office", to_department_id=department.id, actor_role=ActorRole.system, payload={"seeded": True}, created_at=created + timedelta(minutes=4)))
    resolution_status = WindowStatus.open if status not in {GrievanceStatus.resolved, GrievanceStatus.closed, GrievanceStatus.appeal_open} else WindowStatus.met
    db.add(
        ReviewWindow(
            grievance_id=grievance.id,
            window_type=WindowType.resolution,
            opens_at=created,
            deadline_at=created + timedelta(days=21),
            closed_at=now - timedelta(days=1) if resolution_status == WindowStatus.met else None,
            status=resolution_status,
        )
    )
    if atr_text:
        officer = db.scalar(select(User).where(User.role == UserRole.officer))
        db.add(ATR(grievance_id=grievance.id, officer_id=officer.id, content=atr_text, quality_flag=assess_atr(atr_text), created_at=now - timedelta(hours=18)))
        db.add(GrievanceEvent(grievance_id=grievance.id, event_type="atr_filed", actor_role=ActorRole.officer, payload={"seeded": True}, created_at=now - timedelta(hours=18)))
    if appeal:
        grievance.appeal_text = "The closure does not explain the specific payment delay or the date by which arrears will be released."
        db.add(
            ReviewWindow(
                grievance_id=grievance.id,
                window_type=WindowType.appeal,
                opens_at=now - timedelta(days=2),
                deadline_at=now + timedelta(days=28),
                status=WindowStatus.open,
            )
        )
        db.add(GrievanceEvent(grievance_id=grievance.id, event_type="appeal_window_opened", actor_role=ActorRole.system, payload={"seeded": True}, created_at=now - timedelta(days=2)))
    return grievance


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ananya = get_or_create_user(db, "ananya@example.com", "Ananya Sharma", UserRole.citizen)
        rahul = get_or_create_user(db, "rahul@example.com", "Rahul Nair", UserRole.citizen)
        get_or_create_user(db, "officer@example.com", "Demo Grievance Officer", UserRole.officer)
        get_or_create_user(db, "admin@example.com", "Demo Admin", UserRole.admin)

        benefits = get_or_create_department(db, "Citizen Benefits Ministry", DepartmentLevel.ministry)
        pensions = get_or_create_department(db, "Pension Services Department", DepartmentLevel.department, benefits)
        pension_district = get_or_create_department(db, "North District Pension Facilitation Office", DepartmentLevel.district_office, pensions)
        identity = get_or_create_department(db, "Identity and Travel Ministry", DepartmentLevel.ministry)
        passports = get_or_create_department(db, "Passport Resolution Department", DepartmentLevel.department, identity)
        passport_district = get_or_create_department(db, "West District Passport Support Office", DepartmentLevel.district_office, passports)
        services = get_or_create_department(db, "Public Services Ministry", DepartmentLevel.ministry)
        digital = get_or_create_department(db, "Digital Citizen Services Department", DepartmentLevel.department, services)
        digital_district = get_or_create_department(db, "Central District Service Desk", DepartmentLevel.district_office, digital)

        create_seed_grievance(
            db,
            ananya,
            "CPG-2026-000101",
            "My pension arrears have been pending for months despite submitting the requested documents.",
            GrievanceCategory.complaint,
            GrievanceStatus.routed,
            pension_district,
            days_ago=19,
        )
        create_seed_grievance(
            db,
            ananya,
            "CPG-2026-000102",
            "The passport office denied my correction request without explaining the missing document.",
            GrievanceCategory.complaint,
            GrievanceStatus.appeal_open,
            passport_district,
            days_ago=10,
            rating=Rating.poor,
            atr_text="Matter has been resolved as per rules. No further action is required.",
            appeal=True,
        )
        create_seed_grievance(
            db,
            rahul,
            "CPG-2026-000103",
            "The website queue page is confusing and often loses the uploaded file.",
            GrievanceCategory.grievance,
            GrievanceStatus.resolved,
            digital_district,
            days_ago=8,
            rating=Rating.good,
            atr_text="The upload timeout was traced to a session validation issue. The service desk increased the timeout, added retry messaging, and confirmed the citizen's document was received on the test record.",
        )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
