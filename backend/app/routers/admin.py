from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.deps import get_db, require_role
from app.models.department import Department
from app.schemas.grievance import DepartmentRead

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/departments", response_model=list[DepartmentRead])
def list_departments(db: Session = Depends(get_db), _user=Depends(require_role(UserRole.citizen, UserRole.officer, UserRole.admin))):
    return db.scalars(select(Department).order_by(Department.level, Department.name)).all()
