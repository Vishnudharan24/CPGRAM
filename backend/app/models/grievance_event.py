import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ActorRole
from app.database import Base


class GrievanceEvent(Base):
    __tablename__ = "grievance_events"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    grievance_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("grievances.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    from_department_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departments.id"), nullable=True)
    to_department_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departments.id"), nullable=True)
    actor_role: Mapped[ActorRole] = mapped_column(Enum(ActorRole), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    grievance = relationship("Grievance", back_populates="events")
    from_department = relationship("Department", foreign_keys=[from_department_id])
    to_department = relationship("Department", foreign_keys=[to_department_id])
