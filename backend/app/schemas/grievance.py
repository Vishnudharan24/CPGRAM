from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.core.enums import ATRQuality, ActorRole, DepartmentLevel, GrievanceCategory, GrievanceStatus, Rating, WindowStatus, WindowType


class DepartmentRead(BaseModel):
    id: UUID
    name: str
    level: DepartmentLevel
    parent_department_id: UUID | None = None

    model_config = {"from_attributes": True}


class ClassificationRequest(BaseModel):
    description: str


class ClassificationResponse(BaseModel):
    category: GrievanceCategory
    confidence: float
    reasoning: str
    matched_terms: list[str]


class OrganizationRead(BaseModel):
    name: str
    code: str


class GrievanceCreate(BaseModel):
    raw_description: str
    category: GrievanceCategory
    organization_code: str
    category_code: str | None = None
    parent_category_code: str | None = None
    category_name: str | None = None
    category_path: str | None = None
    category_stage: int | None = None
    field_set_id: str | None = None
    category_input_values: dict = {}
    destination_routing_codes: str | None = None


class EventRead(BaseModel):
    id: UUID
    event_type: str
    actor_role: ActorRole
    payload: dict
    created_at: datetime
    from_department: DepartmentRead | None = None
    to_department: DepartmentRead | None = None

    model_config = {"from_attributes": True}


class ATRAttachmentRead(BaseModel):
    id: UUID
    file_name: str
    file_path: str
    content_type: str
    file_size: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ATRRead(BaseModel):
    id: UUID
    content: str
    quality_flag: ATRQuality
    created_at: datetime
    attachments: list[ATRAttachmentRead] = []

    model_config = {"from_attributes": True}


class ReviewWindowRead(BaseModel):
    id: UUID
    window_type: WindowType
    opens_at: datetime
    deadline_at: datetime
    closed_at: datetime | None = None
    status: WindowStatus

    model_config = {"from_attributes": True}


class GrievanceListItem(BaseModel):
    id: UUID
    registration_id: str
    raw_description: str
    organization_name: str
    organization_code: str
    category: GrievanceCategory
    status: GrievanceStatus
    citizen_rating: Rating | None = None
    current_department: DepartmentRead
    created_at: datetime
    updated_at: datetime
    category_path: str | None = None
    category_input_values: dict = {}
    review_windows: list[ReviewWindowRead] = []
    appeal_text: str | None = None
    appeal_decision: str | None = None

    model_config = {"from_attributes": True}


class GrievanceDetail(GrievanceListItem):
    events: list[EventRead] = []
    atrs: list[ATRRead] = []


class RateRequest(BaseModel):
    rating: Rating


class AppealRequest(BaseModel):
    text: str


class ATRCreate(BaseModel):
    content: str
    mark_resolved: bool = True


from pydantic import BaseModel, Field

class AppealDecisionRequest(BaseModel):
    action: str = Field(..., pattern="^(accept|reject)$")
    remarks: str
