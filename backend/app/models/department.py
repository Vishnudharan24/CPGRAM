import uuid

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import DepartmentLevel
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(240), nullable=False, unique=True)
    level: Mapped[DepartmentLevel] = mapped_column(Enum(DepartmentLevel), nullable=False)
    parent_department_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departments.id"), nullable=True)

    parent = relationship("Department", remote_side=[id], back_populates="children")
    children = relationship("Department", back_populates="parent")
