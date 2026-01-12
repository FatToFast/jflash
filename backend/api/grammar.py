"""Grammar CRUD API endpoints."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from database import get_db
from models.grammar import Grammar

router = APIRouter()


# JLPT levels for validation
# Note: Must align with frontend constants (constants.ts: JLPT_LEVELS)
# N5 (easiest) → N1 (hardest)
JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"]


class GrammarCreate(BaseModel):
    """Schema for creating grammar."""

    title: str
    explanation: str | None = None  # 문법 설명 및 용법
    example_jp: str | None = None  # 일본어 예문
    example_kr: str | None = None  # 예문 해석 (한국어)
    level: str | None = None  # N5 ~ N1
    similar_patterns: str | None = None  # 유사 문법
    usage_notes: str | None = None  # 사용 주의사항


class GrammarUpdate(BaseModel):
    """Schema for updating grammar."""

    title: str | None = None
    explanation: str | None = None
    example_jp: str | None = None
    example_kr: str | None = None
    level: str | None = None
    similar_patterns: str | None = None
    usage_notes: str | None = None


class GrammarResponse(BaseModel):
    """Schema for grammar response."""

    id: int
    title: str
    explanation: str | None
    example_jp: str | None
    example_kr: str | None
    level: str | None
    similar_patterns: str | None
    usage_notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class GrammarListResponse(BaseModel):
    """Schema for grammar list response."""

    items: list[GrammarResponse]
    total: int
    page: int
    page_size: int


# Default page size - must align with frontend (constants.ts: DEFAULT_PAGE_SIZE)
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


@router.get("", response_model=GrammarListResponse)
def get_grammar_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE),
    search: str | None = None,
    level: str | None = Query(None, description="JLPT level filter (N5-N1)"),
    sort_by: str = Query("created_at", enum=["created_at", "title", "level"]),
    sort_order: str = Query("desc", enum=["asc", "desc"]),
    db: Session = Depends(get_db),
) -> GrammarListResponse:
    """Get grammar list with pagination, search, and level filter.

    Performance Note:
    - Search uses ILIKE on multiple columns (title, explanation, example_jp)
    - For large datasets (>10K rows), consider adding indexes:
      CREATE INDEX idx_grammar_title ON grammar(title);
      CREATE INDEX idx_grammar_level ON grammar(level);
    - Or implement Full-Text Search (FTS) for better performance
    """
    query = db.query(Grammar)

    # Search filter (multi-column ILIKE)
    # Note: For large datasets, consider FTS or indexed search
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Grammar.title.ilike(search_pattern),
                Grammar.explanation.ilike(search_pattern),
                Grammar.example_jp.ilike(search_pattern),
            )
        )

    # Level filter
    if level and level in JLPT_LEVELS:
        query = query.filter(Grammar.level == level)

    total = query.count()

    # Sorting
    if sort_by == "title":
        order_col = Grammar.title
    elif sort_by == "level":
        order_col = Grammar.level
    else:
        order_col = Grammar.created_at

    if sort_order == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return GrammarListResponse(
        items=[
            GrammarResponse(
                id=g.id,
                title=g.title,
                explanation=g.explanation,
                example_jp=g.example_jp,
                example_kr=g.example_kr,
                level=g.level,
                similar_patterns=g.similar_patterns,
                usage_notes=g.usage_notes,
                created_at=g.created_at,
            )
            for g in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/levels")
def get_jlpt_levels() -> list[str]:
    """Get available JLPT levels."""
    return JLPT_LEVELS


@router.get("/{grammar_id}", response_model=GrammarResponse)
def get_grammar_by_id(
    grammar_id: int,
    db: Session = Depends(get_db),
) -> GrammarResponse:
    """Get a single grammar by ID."""
    grammar = db.query(Grammar).filter(Grammar.id == grammar_id).first()
    if not grammar:
        raise HTTPException(status_code=404, detail="Grammar not found")

    return GrammarResponse(
        id=grammar.id,
        title=grammar.title,
        explanation=grammar.explanation,
        example_jp=grammar.example_jp,
        example_kr=grammar.example_kr,
        level=grammar.level,
        similar_patterns=grammar.similar_patterns,
        usage_notes=grammar.usage_notes,
        created_at=grammar.created_at,
    )


@router.post("", response_model=GrammarResponse, status_code=201)
def create_grammar(
    data: GrammarCreate,
    db: Session = Depends(get_db),
) -> GrammarResponse:
    """Create a new grammar entry."""
    # Validate JLPT level if provided
    if data.level and data.level not in JLPT_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid level. Must be one of: {', '.join(JLPT_LEVELS)}",
        )

    grammar = Grammar(
        title=data.title,
        explanation=data.explanation,
        example_jp=data.example_jp,
        example_kr=data.example_kr,
        level=data.level,
        similar_patterns=data.similar_patterns,
        usage_notes=data.usage_notes,
    )
    db.add(grammar)
    db.commit()
    db.refresh(grammar)

    return GrammarResponse(
        id=grammar.id,
        title=grammar.title,
        explanation=grammar.explanation,
        example_jp=grammar.example_jp,
        example_kr=grammar.example_kr,
        level=grammar.level,
        similar_patterns=grammar.similar_patterns,
        usage_notes=grammar.usage_notes,
        created_at=grammar.created_at,
    )


@router.put("/{grammar_id}", response_model=GrammarResponse)
def update_grammar(
    grammar_id: int,
    data: GrammarUpdate,
    db: Session = Depends(get_db),
) -> GrammarResponse:
    """Update an existing grammar entry."""
    grammar = db.query(Grammar).filter(Grammar.id == grammar_id).first()
    if not grammar:
        raise HTTPException(status_code=404, detail="Grammar not found")

    # Validate JLPT level if provided
    if data.level is not None and data.level not in JLPT_LEVELS and data.level != "":
        raise HTTPException(
            status_code=400,
            detail=f"Invalid level. Must be one of: {', '.join(JLPT_LEVELS)}",
        )

    if data.title is not None:
        grammar.title = data.title
    if data.explanation is not None:
        grammar.explanation = data.explanation
    if data.example_jp is not None:
        grammar.example_jp = data.example_jp
    if data.example_kr is not None:
        grammar.example_kr = data.example_kr
    if data.level is not None:
        grammar.level = data.level if data.level else None
    if data.similar_patterns is not None:
        grammar.similar_patterns = data.similar_patterns
    if data.usage_notes is not None:
        grammar.usage_notes = data.usage_notes

    db.commit()
    db.refresh(grammar)

    return GrammarResponse(
        id=grammar.id,
        title=grammar.title,
        explanation=grammar.explanation,
        example_jp=grammar.example_jp,
        example_kr=grammar.example_kr,
        level=grammar.level,
        similar_patterns=grammar.similar_patterns,
        usage_notes=grammar.usage_notes,
        created_at=grammar.created_at,
    )


@router.delete("/{grammar_id}", status_code=204)
def delete_grammar(
    grammar_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete a grammar entry."""
    grammar = db.query(Grammar).filter(Grammar.id == grammar_id).first()
    if not grammar:
        raise HTTPException(status_code=404, detail="Grammar not found")

    db.delete(grammar)
    db.commit()


@router.get("/stats/summary")
def get_grammar_stats(db: Session = Depends(get_db)) -> dict:
    """Get grammar statistics by JLPT level."""
    total = db.query(func.count(Grammar.id)).scalar() or 0

    # Count by level
    level_counts = {}
    for level in JLPT_LEVELS:
        count = (
            db.query(func.count(Grammar.id)).filter(Grammar.level == level).scalar()
            or 0
        )
        level_counts[level] = count

    # Count items without level
    no_level = (
        db.query(func.count(Grammar.id)).filter(Grammar.level.is_(None)).scalar() or 0
    )
    level_counts["none"] = no_level

    return {
        "total": total,
        "by_level": level_counts,
    }
