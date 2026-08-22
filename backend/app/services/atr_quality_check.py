from app.core.enums import ATRQuality

TEMPLATED_PHRASES = (
    "necessary action has been taken",
    "matter has been resolved",
    "as per rules",
    "disposed of",
    "no further action",
)


def assess_atr(content: str) -> ATRQuality:
    normalized = " ".join(content.lower().split())
    if len(normalized.split()) < 18:
        return ATRQuality.too_short
    if any(phrase in normalized for phrase in TEMPLATED_PHRASES):
        return ATRQuality.templated_language_detected
    return ATRQuality.ok
