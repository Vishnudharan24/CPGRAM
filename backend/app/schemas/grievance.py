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


class GrievanceCreate(BaseModel):
    raw_description: str
    category: GrievanceCategory


class EventRead(BaseModel):
    id: UUID
    event_type: str
    actor_role: ActorRole
    payload: dict
    created_at: datetime
    from_department: DepartmentRead | None = None
    to_department: DepartmentRead | None = None

    model_config = {"from_attributes": True}


class ATRRead(BaseModel):
    id: UUID
    content: str
    quality_flag: ATRQuality
    created_at: datetime

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
    category: GrievanceCategory
    status: GrievanceStatus
    citizen_rating: Rating | None = None
    current_department: DepartmentRead
    created_at: datetime
    updated_at: datetime
    review_windows: list[ReviewWindowRead] = []

    model_config = {"from_attributes": True}


class GrievanceDetail(GrievanceListItem):
    events: list[EventRead] = []
    atrs: list[ATRRead] = []
    appeal_text: str | None = None
    appeal_decision: str | None = None


class RateRequest(BaseModel):
    rating: Rating


class AppealRequest(BaseModel):
    text: str


class ATRCreate(BaseModel):
    content: str
    mark_resolved: bool = True


class AppealDecision(BaseModel):
    decision: str
