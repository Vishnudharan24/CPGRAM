from pydantic import BaseModel, EmailStr, Field
from app.core.enums import UserRole
import uuid
from datetime import datetime

class OfficerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    role: UserRole
    organization_code: str
    level: str
    state_code: str | None = None
    district_code: str | None = None
    password: str

class OfficerRead(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: str | None
    role: UserRole
    organization_code: str | None
    level: str | None
    state_code: str | None = None
    district_code: str | None = None
    created_at: datetime
    
    class Config:
        from_attributes = True
