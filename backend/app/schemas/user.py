from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.core.enums import UserRole


class UserRead(BaseModel):
    id: UUID
    role: UserRole
    name: str
    email: EmailStr
    phone: str | None = None

    model_config = {"from_attributes": True}
