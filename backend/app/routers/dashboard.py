from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import UserRole, WindowStatus, GrievanceStatus
from app.core.rbac import apply_rbac_filter
from app.deps import get_db, require_role
from app.models.grievance import Grievance
from app.models.review_window import ReviewWindow
from app.models.user import User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.citizen, UserRole.officer, UserRole.admin, UserRole.npg, UserRole.gro, UserRole.appellate_authority))):
    grievance_stmt = apply_rbac_filter(select(Grievance), user)
    
    if user.role == UserRole.appellate_authority:
        grievance_stmt = grievance_stmt.where(Grievance.appeal_text.is_not(None))
    
    grievances = db.scalars(grievance_stmt).all()
    ids = [g.id for g in grievances]
    overdue = 0
    if ids:
        overdue = db.scalar(select(func.count(ReviewWindow.id)).where(ReviewWindow.grievance_id.in_(ids), ReviewWindow.status == WindowStatus.missed)) or 0
    by_status = {}
    by_category = {}
    appeals_pending = 0
    appeals_accepted = 0
    appeals_rejected = 0

    for grievance in grievances:
        by_status[grievance.status.value] = by_status.get(grievance.status.value, 0) + 1
        by_category[grievance.category.value] = by_category.get(grievance.category.value, 0) + 1
        
        if grievance.appeal_text:
            if not grievance.appeal_decision:
                if grievance.status == GrievanceStatus.appeal_open:
                    appeals_pending += 1
            elif "[ACCEPT]" in grievance.appeal_decision:
                appeals_accepted += 1
            elif "[REJECT]" in grievance.appeal_decision:
                appeals_rejected += 1

    return {
        "total": len(grievances),
        "overdue": overdue,
        "by_status": by_status,
        "by_category": by_category,
        "appeals_pending": appeals_pending,
        "appeals_accepted": appeals_accepted,
        "appeals_rejected": appeals_rejected
    }
