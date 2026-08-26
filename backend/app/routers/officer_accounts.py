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
def create_officer(payload: OfficerCreate, db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.admin, UserRole.npg))):
    if user.role == UserRole.npg:
        # NPGs can only create GROs in their own org
        if payload.role != UserRole.gro:
            raise HTTPException(status_code=403, detail="NPGs can only create GRO accounts")
        if payload.organization_code != user.organization_code:
            raise HTTPException(status_code=403, detail="Cannot create officers for other organizations")
            
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
        hashed_password=hash_password(payload.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("", response_model=list[OfficerRead])
def list_officers(db: Session = Depends(get_db), user: User = Depends(require_role(UserRole.admin, UserRole.npg))):
    stmt = select(User).where(User.role.in_([UserRole.npg, UserRole.gro, UserRole.officer]))
    if user.role == UserRole.npg:
        stmt = stmt.where(User.organization_code == user.organization_code)
    return db.scalars(stmt).all()
