import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Text, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ATRQuality
from app.database import Base


class ATRAttachment(Base):
    __tablename__ = "atr_attachments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    atr_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("atrs.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    atr = relationship("ATR", back_populates="attachments")


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
    attachments = relationship("ATRAttachment", back_populates="atr", order_by="ATRAttachment.created_at", cascade="all, delete-orphan")
