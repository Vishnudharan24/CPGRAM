from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import ActorRole, WindowStatus, WindowType
from app.models.grievance_event import GrievanceEvent
from app.models.review_window import ReviewWindow
from app.services.notifications import create_notification_event


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def open_resolution_window(db: Session, grievance_id):
    now = utcnow()
    window = ReviewWindow(
        grievance_id=grievance_id,
        window_type=WindowType.resolution,
        opens_at=now,
        deadline_at=now + timedelta(days=21),
        status=WindowStatus.open,
    )
    db.add(window)
    return window


def open_appeal_window(db: Session, grievance_id):
    now = utcnow()
    window = ReviewWindow(
        grievance_id=grievance_id,
        window_type=WindowType.appeal,
        opens_at=now,
        deadline_at=now + timedelta(days=30),
        status=WindowStatus.open,
    )
    db.add(window)
    db.add(GrievanceEvent(grievance_id=grievance_id, event_type="appeal_window_opened", actor_role=ActorRole.system, payload={"deadline_days": 30}))
    return window


def close_window(db: Session, grievance_id, window_type: WindowType):
    window = db.scalars(
        select(ReviewWindow).where(
            ReviewWindow.grievance_id == grievance_id,
            ReviewWindow.window_type == window_type,
            ReviewWindow.status == WindowStatus.open,
        )
    ).first()
    if window:
        window.closed_at = utcnow()
        window.status = WindowStatus.met
    return window


def evaluate_open_windows(db: Session):
    now = utcnow()
    windows = db.scalars(select(ReviewWindow).where(ReviewWindow.status == WindowStatus.open)).all()
    for window in windows:
        if now > window.deadline_at:
            window.status = WindowStatus.missed
            db.add(GrievanceEvent(grievance_id=window.grievance_id, event_type="sla_missed", actor_role=ActorRole.system, payload={"window_type": window.window_type.value}))
            create_notification_event(db, window.grievance_id, "A deadline has passed. Review the case and next available action.")
        elif window.deadline_at - now < timedelta(days=3):
            create_notification_event(db, window.grievance_id, "A grievance deadline closes in less than 3 days.")
    db.commit()
