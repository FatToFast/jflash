"""Morphological analysis API router.

Story 2.3: 형태소 분석 및 단어 추출
- POST /api/morphology/analyze: 일본어 텍스트 형태소 분석
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.morphology_service import analyze_morphology, katakana_to_hiragana

router = APIRouter()
logger = logging.getLogger(__name__)

# Maximum text length for analysis
# - Limits memory usage during morphological parsing
# - Prevents excessive processing time (target: <500ms for max length)
# - Frontend should also validate this limit before sending
# - Typical OCR results: 100-2000 characters per image
MAX_TEXT_LENGTH = 5000


class MorphologyAnalyzeRequest(BaseModel):
    """Request schema for morphological analysis."""

    text: str = Field(
        ...,
        description="Japanese text to analyze",
        min_length=1,
        max_length=MAX_TEXT_LENGTH,
    )
    filter_particles: bool = Field(
        default=True,
        description="Whether to filter out particles and symbols",
    )
    include_reading_hiragana: bool = Field(
        default=True,
        description="Whether to include hiragana reading in addition to katakana",
    )


class WordInfoResponse(BaseModel):
    """Single word analysis result."""

    surface: str
    reading: Optional[str] = None
    reading_hiragana: Optional[str] = None
    pos: str
    pos_detail: Optional[str] = None
    base_form: Optional[str] = None
    is_content_word: bool


class MorphologyAnalyzeResponse(BaseModel):
    """Response schema for morphological analysis."""

    success: bool
    words: List[WordInfoResponse]
    total_count: int
    filtered_count: int
    processing_time_ms: int
    error: Optional[str] = None


@router.post("/analyze", response_model=MorphologyAnalyzeResponse)
async def analyze_text(request: MorphologyAnalyzeRequest) -> MorphologyAnalyzeResponse:
    """Analyze Japanese text morphologically.

    Args:
        request: Analysis request with text and options.

    Returns:
        MorphologyAnalyzeResponse with analyzed words.

    Raises:
        HTTPException: If analysis fails.
    """
    # Validate text
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "Text cannot be empty",
                "code": "EMPTY_TEXT",
            },
        )

    try:
        logger.info(f"Starting morphology analysis for text ({len(request.text)} chars)")

        # Run analysis
        result = analyze_morphology(
            text=request.text,
            filter_particles=request.filter_particles,
        )

        if not result.success:
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": result.error or "Morphology analysis failed",
                    "code": "ANALYSIS_FAILED",
                },
            )

        # Build response
        words = []
        for word in result.words:
            reading_hiragana = None
            if request.include_reading_hiragana and word.reading:
                reading_hiragana = katakana_to_hiragana(word.reading)

            words.append(
                WordInfoResponse(
                    surface=word.surface,
                    reading=word.reading,
                    reading_hiragana=reading_hiragana,
                    pos=word.pos,
                    pos_detail=word.pos_detail,
                    base_form=word.base_form,
                    is_content_word=word.is_content_word,
                )
            )

        return MorphologyAnalyzeResponse(
            success=True,
            words=words,
            total_count=result.total_count,
            filtered_count=result.filtered_count,
            processing_time_ms=result.processing_time_ms,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error during morphology analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "An unexpected error occurred during analysis",
                "code": "INTERNAL_ERROR",
            },
        ) from e
