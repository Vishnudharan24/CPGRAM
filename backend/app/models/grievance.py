import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import GrievanceCategory, GrievanceStatus, Rating
from app.database import Base


class Grievance(Base):
    __tablename__ = "grievances"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    registration_id: Mapped[str] = mapped_column(String(32), nullable=False, unique=True, index=True)
    citizen_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    current_department_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departments.id"), nullable=False)
    raw_description: Mapped[str] = mapped_column(Text, nullable=False)
    organization_name: Mapped[str] = mapped_column(String(240), nullable=False)
    organization_code: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[GrievanceCategory] = mapped_column(Enum(GrievanceCategory), nullable=False)
    status: Mapped[GrievanceStatus] = mapped_column(Enum(GrievanceStatus), nullable=False, default=GrievanceStatus.submitted)
    citizen_rating: Mapped[Rating] = mapped_column(Enum(Rating), nullable=True)
    appeal_text: Mapped[str] = mapped_column(Text, nullable=True)
    appeal_decision: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    citizen = relationship("User", back_populates="grievances", foreign_keys=[citizen_id])
    current_department = relationship("Department")
    events = relationship("GrievanceEvent", back_populates="grievance", order_by="GrievanceEvent.created_at")
    atrs = relationship("ATR", back_populates="grievance", order_by="ATR.created_at")
    review_windows = relationship("ReviewWindow", back_populates="grievance", order_by="ReviewWindow.opens_at")
