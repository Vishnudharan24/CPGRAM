from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.enums import UserRole
from app.core.security import hash_password
from app.deps import get_db, require_role
from app.models.user import User
from app.schemas.officer import OfficerCreate, OfficerRead

router = APIRouter(prefix="/officer-accounts", tags=["officers_management"])

@router.post("", response_model=OfficerRead)
def create_officer(payload: OfficerCreate, db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.admin, UserRole.central_admin, UserRole.state_admin, UserRole.ut_admin, UserRole.npg))):
    if user.role == UserRole.central_admin:
        if payload.level != 'Central' or payload.organization_code != user.organization_code:
            raise HTTPException(status_code=403, detail="Central Admins can only create officers for their own Ministry/Department")
    elif user.role in (UserRole.state_admin, UserRole.ut_admin):
        if payload.level not in ('State', 'District') or payload.state_code != user.state_code:
            raise HTTPException(status_code=403, detail="State/UT Admins can only create officers for their own State/UT")
    elif user.role == UserRole.npg:
        if payload.role not in (UserRole.gro, UserRole.appellate_authority):
            raise HTTPException(status_code=403, detail="NPGs can only create GRO or Appellate Authority accounts")
        if payload.organization_code != user.organization_code:
            raise HTTPException(status_code=403, detail="Cannot create officers for other organizations")
        if user.state_code and payload.state_code != user.state_code:
            raise HTTPException(status_code=403, detail="Cannot create officers outside your assigned State")
            
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
        
    new_user = User(
        name=payload.name,
        email=payload.email.lower(),
        phone=payload.phone or "0000000000",
        role=payload.role,
        organization_code=payload.organization_code,
        level=payload.level,
        state_code=payload.state_code,
        district_code=payload.district_code,
        hashed_password=hash_password(payload.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("", response_model=list[OfficerRead])
def list_officers(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.admin, UserRole.central_admin, UserRole.state_admin, UserRole.ut_admin, UserRole.npg))):
    stmt = select(User).where(User.role.in_([UserRole.npg, UserRole.gro, UserRole.officer, UserRole.appellate_authority]))
    
    if user.role == UserRole.central_admin:
        stmt = stmt.where(User.level == 'Central', User.organization_code == user.organization_code)
    elif user.role in (UserRole.state_admin, UserRole.ut_admin):
        stmt = stmt.where(User.level.in_(['State', 'District']), User.state_code == user.state_code)
    elif user.role == UserRole.npg:
        stmt = stmt.where(User.organization_code == user.organization_code)
        if user.state_code:
            stmt = stmt.where(User.state_code == user.state_code)
            
    return db.scalars(stmt).all()
