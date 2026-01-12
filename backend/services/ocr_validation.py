from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from services.ocr_service import OcrItem

MIN_AVG_CONFIDENCE = 0.5
MIN_JP_CHAR_RATIO = 0.2
MIN_CHAR_COUNT = 20


@dataclass(frozen=True)
class ValidationMetrics:
    status: str
    avg_confidence: float
    jp_char_ratio: float
    issues: list[str]


def is_japanese_char(char: str) -> bool:
    code = ord(char)
    return (
        0x3040 <= code <= 0x309F  # Hiragana
        or 0x30A0 <= code <= 0x30FF  # Katakana
        or 0x4E00 <= code <= 0x9FFF  # CJK Unified Ideographs
        or 0x3400 <= code <= 0x4DBF  # CJK Unified Ideographs Extension A
        or 0xF900 <= code <= 0xFAFF  # CJK Compatibility Ideographs
    )


def validate_ocr(text: str, items: Iterable[OcrItem]) -> ValidationMetrics:
    confidences = [item.confidence for item in items]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

    total_chars = sum(1 for char in text if not char.isspace())
    jp_chars = sum(1 for char in text if is_japanese_char(char))
    jp_char_ratio = jp_chars / total_chars if total_chars else 0.0

    issues: list[str] = []
    if total_chars == 0:
        issues.append("no_text_detected")
    if avg_confidence < MIN_AVG_CONFIDENCE:
        issues.append("low_avg_confidence")
    if jp_char_ratio < MIN_JP_CHAR_RATIO:
        issues.append("low_jp_char_ratio")
    if total_chars < MIN_CHAR_COUNT:
        issues.append("low_char_count")

    if "no_text_detected" in issues:
        status = "fail"
    elif issues:
        status = "warn"
    else:
        status = "pass"

    return ValidationMetrics(
        status=status,
        avg_confidence=avg_confidence,
        jp_char_ratio=jp_char_ratio,
        issues=issues,
    )
