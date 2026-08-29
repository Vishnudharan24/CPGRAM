from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.deps import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        name=payload.name,
        gender=payload.gender,
        premise_name=payload.premise_name,
        sub_locality=payload.sub_locality,
        locality=payload.locality,
        country=payload.country,
        state_code=payload.state_code,
        district_code=payload.district_code,
        pincode=payload.pincode,
        mobile_number=payload.mobile_number,
        email=payload.email.lower(),
        phone=payload.phone,
        role=payload.role,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), user.role.value)
    return TokenResponse(
        access_token=token, 
        role=user.role, 
        name=user.name, 
        email=user.email,
        state_code=user.state_code,
        district_code=user.district_code,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(str(user.id), user.role.value)
    return TokenResponse(
        access_token=token, 
        role=user.role, 
        name=user.name, 
        email=user.email,
        organization_code=user.organization_code,
        level=user.level,
        state_code=user.state_code,
        district_code=user.district_code
    )
