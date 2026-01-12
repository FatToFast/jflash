from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ValidationResult(BaseModel):
    status: Literal["pass", "warn", "fail"]
    avg_confidence: float = Field(..., ge=0.0, le=1.0)
    jp_char_ratio: float = Field(..., ge=0.0, le=1.0)
    issues: list[str]


class WordCandidate(BaseModel):
    kanji: str
    reading: str | None = None
    pos: str | None = None


class UploadResponse(BaseModel):
    success: bool = True
    extracted_text: str
    validation: ValidationResult
    words: list[WordCandidate]
