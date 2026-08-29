from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.core.enums import UserRole


class UserRead(BaseModel):
    id: UUID
    role: UserRole
    name: str
    gender: str | None = None
    premise_name: str | None = None
    sub_locality: str | None = None
    locality: str | None = None
    country: str | None = None
    state_code: str | None = None
    district_code: str | None = None
    pincode: str | None = None
    mobile_number: str | None = None
    email: EmailStr
    phone: str | None = None

    model_config = {"from_attributes": True}
