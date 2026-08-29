from pydantic import BaseModel, EmailStr, Field, model_validator

from app.core.enums import UserRole


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    gender: str = Field(min_length=1)
    premise_name: str = Field(min_length=1)
    sub_locality: str = Field(min_length=1)
    locality: str = Field(min_length=1)
    country: str = Field(min_length=1)
    state_code: str = Field(min_length=1)
    district_code: str = Field(min_length=1)
    pincode: str = Field(min_length=1)
    mobile_number: str = Field(pattern=r"^\d{10}$")
    email: EmailStr
    password: str
    confirm_password: str
    phone: str | None = Field(default=None, pattern=r"^(?:[0-9+() -]*\d[0-9+() -]*)?$")
    role: UserRole = UserRole.citizen

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    name: str
    email: EmailStr
    organization_code: str | None = None
    level: str | None = None
    state_code: str | None = None
    district_code: str | None = None
