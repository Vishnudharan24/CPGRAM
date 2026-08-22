from dataclasses import dataclass

from app.core.enums import GrievanceCategory


@dataclass(frozen=True)
class ClassificationResult:
    category: GrievanceCategory
    confidence: float
    reasoning: str
    matched_terms: list[str]


COMPLAINT_TERMS = {
    "pension", "refund", "not received", "denied", "wrongly", "pending", "stuck",
    "harassment", "corruption", "bribe", "delay", "passport", "ration", "benefit",
}
GRIEVANCE_TERMS = {"slow", "rude", "confusing", "website", "queue", "service", "always", "office"}
SUGGESTION_TERMS = {"should", "suggest", "idea", "improve", "feature", "add", "recommend"}


def classify_description(description: str) -> ClassificationResult:
    text = description.lower()
    complaint_hits = sorted(term for term in COMPLAINT_TERMS if term in text)
    grievance_hits = sorted(term for term in GRIEVANCE_TERMS if term in text)
    suggestion_hits = sorted(term for term in SUGGESTION_TERMS if term in text)

    if complaint_hits:
        return ClassificationResult(
            category=GrievanceCategory.complaint,
            confidence=min(0.96, 0.72 + len(complaint_hits) * 0.04),
            reasoning="This describes a specific personal harm or delayed entitlement, so it should require an Action Taken Report before closure.",
            matched_terms=complaint_hits,
        )
    if suggestion_hits and not grievance_hits:
        return ClassificationResult(
            category=GrievanceCategory.suggestion,
            confidence=min(0.9, 0.68 + len(suggestion_hits) * 0.05),
            reasoning="This reads like an improvement idea without a specific unresolved harm to the citizen.",
            matched_terms=suggestion_hits,
        )
    if grievance_hits:
        return ClassificationResult(
            category=GrievanceCategory.grievance,
            confidence=min(0.88, 0.64 + len(grievance_hits) * 0.04),
            reasoning="This describes a service quality issue, so it belongs in the grievance queue with visible routing.",
            matched_terms=grievance_hits,
        )
    return ClassificationResult(
        category=GrievanceCategory.grievance,
        confidence=0.55,
        reasoning="No strong keyword was detected, so this is conservatively treated as a grievance and shown to the citizen for confirmation.",
        matched_terms=[],
    )
