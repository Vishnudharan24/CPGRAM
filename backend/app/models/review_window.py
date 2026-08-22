import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import WindowStatus, WindowType
from app.database import Base


class ReviewWindow(Base):
    __tablename__ = "review_windows"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    grievance_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("grievances.id"), nullable=False)
    window_type: Mapped[WindowType] = mapped_column(Enum(WindowType), nullable=False)
    opens_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    deadline_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    closed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[WindowStatus] = mapped_column(Enum(WindowStatus), nullable=False, default=WindowStatus.open)

    grievance = relationship("Grievance", back_populates="review_windows")
