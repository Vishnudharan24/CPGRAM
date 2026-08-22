from app.core.enums import ActorRole
from app.models.grievance_event import GrievanceEvent


def create_notification_event(db, grievance_id, message: str):
    db.add(
        GrievanceEvent(
            grievance_id=grievance_id,
            event_type="notification",
            actor_role=ActorRole.system,
            payload={"message": message},
        )
    )
