from enum import Enum


class UserRole(str, Enum):
    citizen = "citizen"
    officer = "officer"
    admin = "admin"
    central_admin = "central_admin"
    state_admin = "state_admin"
    ut_admin = "ut_admin"
    npg = "npg"
    gro = "gro"
    appellate_authority = "appellate_authority"


class DepartmentLevel(str, Enum):
    ministry = "ministry"
    department = "department"
    district_office = "district_office"


class GrievanceCategory(str, Enum):
    complaint = "complaint"
    grievance = "grievance"
    suggestion = "suggestion"


class GrievanceStatus(str, Enum):
    submitted = "submitted"
    routed = "routed"
    under_review = "under_review"
    atr_filed = "atr_filed"
    resolved = "resolved"
    rated_poor = "rated_poor"
    appeal_open = "appeal_open"
    appeal_resolved = "appeal_resolved"
    closed = "closed"


class Rating(str, Enum):
    good = "good"
    average = "average"
    poor = "poor"


class ActorRole(str, Enum):
    citizen = "citizen"
    officer = "officer"
    system = "system"
    admin = "admin"
    central_admin = "central_admin"
    state_admin = "state_admin"
    ut_admin = "ut_admin"
    npg = "npg"
    gro = "gro"
    appellate_authority = "appellate_authority"


class ATRQuality(str, Enum):
    ok = "ok"
    too_short = "too_short"
    templated_language_detected = "templated_language_detected"


class WindowType(str, Enum):
    resolution = "resolution"
    appeal = "appeal"


class WindowStatus(str, Enum):
    open = "open"
    met = "met"
    missed = "missed"
    escalated = "escalated"
