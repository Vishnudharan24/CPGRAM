import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ATRQuality
from app.database import Base


class ATR(Base):
    __tablename__ = "atrs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    grievance_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("grievances.id"), nullable=False)
    officer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    quality_flag: Mapped[ATRQuality] = mapped_column(Enum(ATRQuality), nullable=False, default=ATRQuality.ok)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    grievance = relationship("Grievance", back_populates="atrs")
    officer = relationship("User")
