"""Kanji API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.kanji import Kanji
from services.kanji_service import (
    KANJI_DICT,
    analyze_kanji_in_word,
    extract_kanji_from_text,
    get_kanji_info,
    is_kanji,
)

router = APIRouter()

# Maximum text length for kanji analysis
# Consistent with morphology API limit (morphology.py: MAX_TEXT_LENGTH)
MAX_KANJI_TEXT_LENGTH = 5000


# Response models
class KanjiInfoResponse(BaseModel):
    """Response model for kanji information."""

    character: str
    on_readings: list[str]
    kun_readings: list[str]
    meanings: list[str]
    meanings_ko: list[str]
    stroke_count: int | None
    jlpt_level: int | None


class KanjiAnalyzeRequest(BaseModel):
    """Request model for analyzing kanji in text."""

    text: str


class KanjiAnalyzeResponse(BaseModel):
    """Response model for kanji analysis.

    Note on kanji_count:
    - Returns count of UNIQUE kanji characters (duplicates removed)
    - Order is preserved (first occurrence order)
    - This is intentional design for vocabulary learning context
    - If total occurrence count is needed, frontend can count from source text
    """

    kanji_count: int  # 고유 한자 수 (중복 제외)
    kanji_list: list[KanjiInfoResponse]


class KanjiListResponse(BaseModel):
    """Response model for kanji list."""

    items: list[KanjiInfoResponse]
    total: int


@router.get("/info/{character}", response_model=KanjiInfoResponse)
def get_single_kanji_info(character: str) -> KanjiInfoResponse:
    """Get information about a single kanji character.

    Args:
        character: A single kanji character
    """
    if len(character) != 1:
        raise HTTPException(
            status_code=400,
            detail="Please provide a single character",
        )

    if not is_kanji(character):
        raise HTTPException(
            status_code=400,
            detail=f"'{character}' is not a kanji character",
        )

    info = get_kanji_info(character)
    if not info:
        raise HTTPException(
            status_code=404,
            detail=f"Kanji '{character}' not found",
        )

    return KanjiInfoResponse(**info)


@router.post("/analyze", response_model=KanjiAnalyzeResponse)
def analyze_text_kanji(data: KanjiAnalyzeRequest) -> KanjiAnalyzeResponse:
    """Extract and analyze all kanji from text.

    Args:
        data: Request containing text to analyze

    Raises:
        HTTPException 400: If text is empty or exceeds MAX_KANJI_TEXT_LENGTH
    """
    if not data.text:
        raise HTTPException(
            status_code=400,
            detail="Text is required",
        )

    if len(data.text) > MAX_KANJI_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds maximum length of {MAX_KANJI_TEXT_LENGTH} characters",
        )

    kanji_list = analyze_kanji_in_word(data.text)

    return KanjiAnalyzeResponse(
        kanji_count=len(kanji_list),
        kanji_list=[KanjiInfoResponse(**k) for k in kanji_list],
    )


@router.get("/word/{word}", response_model=KanjiAnalyzeResponse)
def get_kanji_in_word(word: str) -> KanjiAnalyzeResponse:
    """Get all kanji information for a word.

    This is useful for vocabulary items to show kanji breakdown.

    Args:
        word: Japanese word to analyze
    """
    kanji_list = analyze_kanji_in_word(word)

    return KanjiAnalyzeResponse(
        kanji_count=len(kanji_list),
        kanji_list=[KanjiInfoResponse(**k) for k in kanji_list],
    )


@router.get("/extract")
def extract_kanji(text: str = Query(..., description="Text to extract kanji from")) -> dict:
    """Extract unique kanji characters from text.

    Returns just the list of kanji characters without detailed info.
    Useful for quick extraction.

    Args:
        text: Text to extract kanji from
    """
    kanji_chars = extract_kanji_from_text(text)
    return {
        "count": len(kanji_chars),
        "characters": kanji_chars,
    }


@router.get("/stats")
def get_kanji_stats(db: Session = Depends(get_db)) -> dict:
    """Get kanji statistics.

    Returns count of kanji in database by JLPT level.
    """
    # Get saved kanji stats from DB
    total = db.query(func.count(Kanji.id)).scalar() or 0

    # Count by JLPT level
    level_counts = {}
    for level in [5, 4, 3, 2, 1]:
        count = (
            db.query(func.count(Kanji.id))
            .filter(Kanji.jlpt_level == level)
            .scalar()
            or 0
        )
        level_counts[f"N{level}"] = count

    return {
        "total_saved": total,
        "by_level": level_counts,
        "dictionary_size": len(KANJI_DICT),  # Actual size of built-in dictionary
    }


# Vocabulary integration endpoints
@router.get("/vocab/{vocab_id}/kanji", response_model=KanjiAnalyzeResponse)
def get_vocab_kanji(
    vocab_id: int,
    db: Session = Depends(get_db),
) -> KanjiAnalyzeResponse:
    """Get kanji breakdown for a vocabulary item.

    Args:
        vocab_id: Vocabulary item ID
    """
    from models.vocabulary import Vocabulary

    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    kanji_list = analyze_kanji_in_word(vocab.kanji)

    return KanjiAnalyzeResponse(
        kanji_count=len(kanji_list),
        kanji_list=[KanjiInfoResponse(**k) for k in kanji_list],
    )
