from pydantic import BaseModel, EmailStr

from app.core.enums import UserRole


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    role: UserRole = UserRole.citizen


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    name: str
    email: EmailStr
