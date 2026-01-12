"""Vocabulary CRUD API endpoints."""

import logging
import os
import re
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models.vocabulary import SRSReview, Vocabulary

logger = logging.getLogger(__name__)

# Deploy mode check
IS_LITE_MODE = os.getenv("DEPLOY_MODE", "full").lower() == "lite"

# Uploads directory (same as main.py)
UPLOADS_DIR = Path(__file__).parent.parent / "uploads"


def require_full_mode():
    """Dependency to require full mode for write operations."""
    if IS_LITE_MODE:
        raise HTTPException(
            status_code=403,
            detail="This operation is not available in lite mode. Use local environment for data modification.",
        )

# Valid filename pattern (UUID hex + extension) - same as ocr.py
VALID_FILENAME_PATTERN = re.compile(r"^[a-f0-9]{32}\.(jpg|jpeg|png)$", re.IGNORECASE)

router = APIRouter()


def validate_and_resolve_image_path(image_path: str | None) -> Path | None:
    """Validate and resolve image path securely.

    Prevents path traversal by:
    1. Only allowing /uploads/ prefix
    2. Validating filename format (UUID hex + extension)
    3. Resolving and checking path is within UPLOADS_DIR

    Args:
        image_path: Path like "/uploads/abc123def456.jpg"

    Returns:
        Resolved Path within UPLOADS_DIR, or None if invalid
    """
    if not image_path:
        return None

    # Extract filename from path
    if not image_path.startswith("/uploads/"):
        logger.warning(f"Invalid image path format: {image_path}")
        return None

    filename = image_path[9:]  # Remove "/uploads/" prefix

    # Validate filename format (must be UUID hex + valid extension)
    if not VALID_FILENAME_PATTERN.match(filename):
        logger.warning(f"Invalid filename format: {filename}")
        return None

    # Build and resolve path
    file_path = (UPLOADS_DIR / filename).resolve()

    # Security check: ensure path is within UPLOADS_DIR
    try:
        file_path.relative_to(UPLOADS_DIR.resolve())
    except ValueError:
        logger.warning(f"Path traversal attempt detected: {image_path}")
        return None

    return file_path


def read_and_delete_image(image_path: str | None) -> bytes | None:
    """Read image file, return bytes, and delete the original file.

    Args:
        image_path: Path like "/uploads/filename.jpg"

    Returns:
        Image bytes or None if file doesn't exist or path is invalid
    """
    file_path = validate_and_resolve_image_path(image_path)
    if not file_path:
        return None

    if not file_path.exists():
        logger.warning(f"Image file not found: {file_path}")
        return None

    try:
        with open(file_path, "rb") as f:
            data = f.read()

        # Delete original file after reading
        file_path.unlink()
        logger.info(f"Image saved to DB and deleted: {file_path.name}")

        return data
    except Exception as e:
        logger.error(f"Error reading image file: {e}")
        return None


class VocabCreate(BaseModel):
    """Schema for creating vocabulary."""

    kanji: str
    reading: str | None = None
    meaning: str | None = None
    pos: str | None = None
    source_img: str | None = None


class VocabUpdate(BaseModel):
    """Schema for updating vocabulary."""

    kanji: str | None = None
    reading: str | None = None
    meaning: str | None = None
    pos: str | None = None


class VocabResponse(BaseModel):
    """Schema for vocabulary response."""

    id: int
    kanji: str
    reading: str | None
    meaning: str | None
    pos: str | None
    source_img: str | None
    has_image: bool = False  # Story 3.4: 이미지 존재 여부
    created_at: datetime
    next_review: datetime | None = None
    reps: int = 0
    # LLM 추출 확장 필드
    jlpt_level: str | None = None
    example_sentence: str | None = None
    example_meaning: str | None = None
    source_context: str | None = None
    confidence: float | None = None
    surface: str | None = None
    needs_review: int | None = None

    class Config:
        from_attributes = True


class VocabListResponse(BaseModel):
    """Schema for vocabulary list response."""

    items: list[VocabResponse]
    total: int
    page: int
    page_size: int


class BulkVocabCreate(BaseModel):
    """Schema for bulk vocabulary creation."""

    words: list[VocabCreate]


class BulkVocabResponse(BaseModel):
    """Schema for bulk creation response."""

    created: int
    items: list[VocabResponse]


@router.get("", response_model=VocabListResponse)
def get_vocabulary(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("created_at", enum=["created_at", "kanji", "next_review"]),
    sort_order: str = Query("desc", enum=["asc", "desc"]),
    db: Session = Depends(get_db),
) -> VocabListResponse:
    """Get vocabulary list with pagination and search."""
    # Use joinedload to prevent N+1 queries when accessing srs_review
    query = db.query(Vocabulary).outerjoin(SRSReview).options(joinedload(Vocabulary.srs_review))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Vocabulary.kanji.ilike(search_pattern),
                Vocabulary.reading.ilike(search_pattern),
                Vocabulary.meaning.ilike(search_pattern),
            )
        )

    total = query.count()

    if sort_by == "next_review":
        order_col = SRSReview.next_review
    elif sort_by == "kanji":
        order_col = Vocabulary.kanji
    else:
        order_col = Vocabulary.created_at

    if sort_order == "asc":
        query = query.order_by(order_col.asc())
    else:
        query = query.order_by(order_col.desc())

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return VocabListResponse(
        items=[
            VocabResponse(
                id=v.id,
                kanji=v.kanji,
                reading=v.reading,
                meaning=v.meaning,
                pos=v.pos,
                source_img=v.source_img,
                has_image=v.source_img_data is not None,
                created_at=v.created_at,
                next_review=v.srs_review.next_review if v.srs_review else None,
                reps=v.srs_review.reps if v.srs_review else 0,
                jlpt_level=v.jlpt_level,
                example_sentence=v.example_sentence,
                example_meaning=v.example_meaning,
                source_context=v.source_context,
                confidence=v.confidence,
                surface=v.surface,
                needs_review=v.needs_review,
            )
            for v in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{vocab_id}", response_model=VocabResponse)
def get_vocabulary_by_id(
    vocab_id: int,
    db: Session = Depends(get_db),
) -> VocabResponse:
    """Get a single vocabulary by ID."""
    vocab = (
        db.query(Vocabulary)
        .options(joinedload(Vocabulary.srs_review))
        .filter(Vocabulary.id == vocab_id)
        .first()
    )
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    return VocabResponse(
        id=vocab.id,
        kanji=vocab.kanji,
        reading=vocab.reading,
        meaning=vocab.meaning,
        pos=vocab.pos,
        source_img=vocab.source_img,
        has_image=vocab.source_img_data is not None,
        created_at=vocab.created_at,
        next_review=vocab.srs_review.next_review if vocab.srs_review else None,
        reps=vocab.srs_review.reps if vocab.srs_review else 0,
        jlpt_level=vocab.jlpt_level,
        example_sentence=vocab.example_sentence,
        example_meaning=vocab.example_meaning,
        source_context=vocab.source_context,
        confidence=vocab.confidence,
        surface=vocab.surface,
        needs_review=vocab.needs_review,
    )


@router.post("", response_model=VocabResponse, status_code=201)
def create_vocabulary(
    data: VocabCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_full_mode),
) -> VocabResponse:
    """Create a new vocabulary entry."""
    vocab = Vocabulary(
        kanji=data.kanji,
        reading=data.reading,
        meaning=data.meaning,
        pos=data.pos,
        source_img=data.source_img,
    )
    db.add(vocab)
    db.flush()

    srs = SRSReview(vocab_id=vocab.id)
    db.add(srs)
    db.commit()
    db.refresh(vocab)

    return VocabResponse(
        id=vocab.id,
        kanji=vocab.kanji,
        reading=vocab.reading,
        meaning=vocab.meaning,
        pos=vocab.pos,
        source_img=vocab.source_img,
        has_image=False,  # 개별 추가는 이미지 없음
        created_at=vocab.created_at,
        next_review=vocab.srs_review.next_review if vocab.srs_review else None,
        reps=0,
        jlpt_level=vocab.jlpt_level,
        example_sentence=vocab.example_sentence,
        example_meaning=vocab.example_meaning,
        source_context=vocab.source_context,
        confidence=vocab.confidence,
        surface=vocab.surface,
        needs_review=vocab.needs_review,
    )


@router.post("/bulk", response_model=BulkVocabResponse, status_code=201)
def create_vocabulary_bulk(
    data: BulkVocabCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_full_mode),
) -> BulkVocabResponse:
    """Create multiple vocabulary entries at once.

    Story 3.4: 이미지 파일이 있으면 DB에 저장하고 원본 파일 삭제

    이미지 저장 설계:
    - 한 OCR 이미지에서 추출된 여러 단어는 같은 source_img 경로를 공유
    - 이미지 바이트 데이터(source_img_data)는 첫 번째 단어에만 저장 (중복 방지)
    - 다른 단어들은 source_img 경로만 참조용으로 유지
    - API에서 이미지 조회 시 has_image=true인 단어만 이미지 반환 가능

    UI에서 이미지를 표시하려면:
    - has_image 필드를 확인하거나
    - 같은 source_img를 가진 단어 중 첫 번째를 찾아 이미지 조회
    """
    created_items: list[VocabResponse] = []

    # 같은 이미지 경로의 단어들이 있으므로 한 번만 읽음
    # 첫 번째 단어에만 이미지 데이터를 저장하여 중복 저장 방지
    image_data: bytes | None = None
    first_image_path: str | None = None

    for word in data.words:
        # 첫 번째 유효한 이미지 경로의 파일만 읽고 저장
        if word.source_img and image_data is None:
            first_image_path = word.source_img
            image_data = read_and_delete_image(word.source_img)

        vocab = Vocabulary(
            kanji=word.kanji,
            reading=word.reading,
            meaning=word.meaning,
            pos=word.pos,
            source_img=word.source_img,
            source_img_data=image_data if word.source_img == first_image_path else None,
        )
        db.add(vocab)
        db.flush()

        srs = SRSReview(vocab_id=vocab.id)
        db.add(srs)
        db.flush()

        created_items.append(
            VocabResponse(
                id=vocab.id,
                kanji=vocab.kanji,
                reading=vocab.reading,
                meaning=vocab.meaning,
                pos=vocab.pos,
                source_img=vocab.source_img,
                has_image=vocab.source_img_data is not None,
                created_at=vocab.created_at,
                next_review=srs.next_review,
                reps=0,
                jlpt_level=vocab.jlpt_level,
                example_sentence=vocab.example_sentence,
                example_meaning=vocab.example_meaning,
                source_context=vocab.source_context,
                confidence=vocab.confidence,
                surface=vocab.surface,
                needs_review=vocab.needs_review,
            )
        )

    db.commit()

    return BulkVocabResponse(created=len(created_items), items=created_items)


@router.put("/{vocab_id}", response_model=VocabResponse)
def update_vocabulary(
    vocab_id: int,
    data: VocabUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_full_mode),
) -> VocabResponse:
    """Update an existing vocabulary entry."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    if data.kanji is not None:
        vocab.kanji = data.kanji
    if data.reading is not None:
        vocab.reading = data.reading
    if data.meaning is not None:
        vocab.meaning = data.meaning
    if data.pos is not None:
        vocab.pos = data.pos

    db.commit()
    db.refresh(vocab)

    return VocabResponse(
        id=vocab.id,
        kanji=vocab.kanji,
        reading=vocab.reading,
        meaning=vocab.meaning,
        pos=vocab.pos,
        source_img=vocab.source_img,
        has_image=vocab.source_img_data is not None,
        created_at=vocab.created_at,
        next_review=vocab.srs_review.next_review if vocab.srs_review else None,
        reps=vocab.srs_review.reps if vocab.srs_review else 0,
        jlpt_level=vocab.jlpt_level,
        example_sentence=vocab.example_sentence,
        example_meaning=vocab.example_meaning,
        source_context=vocab.source_context,
        confidence=vocab.confidence,
        surface=vocab.surface,
        needs_review=vocab.needs_review,
    )


@router.delete("/{vocab_id}", status_code=204)
def delete_vocabulary(
    vocab_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_full_mode),
) -> None:
    """Delete a vocabulary entry."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    db.delete(vocab)
    db.commit()


def detect_image_content_type(image_data: bytes, fallback_path: str | None = None) -> str:
    """Detect image content type from magic bytes, with path fallback.

    Args:
        image_data: Raw image bytes
        fallback_path: Optional path to use for extension-based fallback

    Returns:
        MIME type string (image/jpeg or image/png)
    """
    # Check magic bytes first (most reliable)
    if image_data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if image_data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"

    # Fallback to path extension if magic bytes don't match
    if fallback_path and fallback_path.lower().endswith(".png"):
        return "image/png"

    # Default to JPEG
    return "image/jpeg"


@router.get("/{vocab_id}/image")
def get_vocabulary_image(
    vocab_id: int,
    db: Session = Depends(get_db),
) -> Response:
    """Get the source image for a vocabulary entry.

    Story 3.4: DB에 저장된 이미지를 반환
    """
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(status_code=404, detail="Vocabulary not found")

    if not vocab.source_img_data:
        raise HTTPException(status_code=404, detail="Image not found")

    # Determine content type from magic bytes (more reliable than path)
    content_type = detect_image_content_type(vocab.source_img_data, vocab.source_img)

    return Response(
        content=vocab.source_img_data,
        media_type=content_type,
    )


@router.get("/stats/summary")
def get_vocab_stats(db: Session = Depends(get_db)) -> dict:
    """Get vocabulary statistics."""
    total = db.query(func.count(Vocabulary.id)).scalar() or 0
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    due_today = (
        db.query(func.count(SRSReview.id))
        .filter(SRSReview.next_review <= datetime.now())
        .scalar()
        or 0
    )

    learned = (
        db.query(func.count(SRSReview.id)).filter(SRSReview.reps > 0).scalar() or 0
    )

    return {
        "total": total,
        "due_today": due_today,
        "learned": learned,
        "new": total - learned,
    }
