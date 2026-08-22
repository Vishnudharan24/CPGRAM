from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import ActorRole, DepartmentLevel
from app.models.department import Department
from app.models.grievance import Grievance
from app.models.grievance_event import GrievanceEvent


KEYWORD_DEPARTMENTS = {
    "pension": "Citizen Benefits Ministry",
    "passport": "Identity and Travel Ministry",
    "refund": "Public Services Ministry",
    "ration": "Citizen Benefits Ministry",
    "website": "Public Services Ministry",
}


def choose_starting_department(db: Session, description: str) -> Department:
    text = description.lower()
    preferred = next((name for term, name in KEYWORD_DEPARTMENTS.items() if term in text), "Public Services Ministry")
    department = db.scalar(select(Department).where(Department.name == preferred))
    if department:
        return department
    return db.scalar(select(Department).where(Department.level == DepartmentLevel.ministry))


def _first_child(db: Session, parent_id):
    return db.scalar(select(Department).where(Department.parent_department_id == parent_id).order_by(Department.name))


def route_grievance(db: Session, grievance: Grievance, starting_department: Department):
    current = starting_department
    db.add(GrievanceEvent(grievance_id=grievance.id, event_type="routed_to_ministry", to_department_id=current.id, actor_role=ActorRole.system, payload={"reason": "Initial keyword routing"}))

    while current.level != DepartmentLevel.district_office:
        child = _first_child(db, current.id)
        if not child:
            break
        db.add(
            GrievanceEvent(
                grievance_id=grievance.id,
                event_type=f"routed_to_{child.level.value}",
                from_department_id=current.id,
                to_department_id=child.id,
                actor_role=ActorRole.system,
                payload={"reason": "Simulated CPGRAMS forwarding hop"},
            )
        )
        current = child

    grievance.current_department_id = current.id
    return current
