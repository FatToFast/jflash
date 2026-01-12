"""Export/Import API endpoints for data management.

FR-025: 단어장을 CSV/JSON 형태로 내보내기
FR-026: 외부에서 만든 단어장 가져오기

중복 판단 로직:
- Vocabulary: (kanji, reading, meaning) 복합 키로 중복 판단
  - 같은 kanji라도 reading/meaning이 다르면 다른 단어로 취급
  - 예: 生 (なま/raw) vs 生 (せい/life) 는 별개 항목
- Grammar: (title, meaning) 복합 키로 중복 판단
  - 같은 문법 제목이라도 의미가 다르면 별개 항목

성능 고려사항:
- 현재 구현은 전체 파일을 메모리에 로드 (소규모 학습용 데이터 가정)
- 대용량 처리가 필요한 경우 스트리밍 파서 또는 청크 처리 권장
- 권장 최대 파일 크기: 10MB (약 50,000개 항목)
"""

import csv
import json
import mimetypes
from datetime import datetime
from io import StringIO
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.grammar import Grammar
from models.vocabulary import SRSReview, Vocabulary

router = APIRouter()

# Constants
# Encoding fallback for Korean Windows files
FALLBACK_ENCODING = "cp949"
# Maximum number of errors to include in response
MAX_ERRORS_IN_RESPONSE = 10
# Valid MIME types for file upload
VALID_CSV_MIMETYPES = {"text/csv", "application/csv", "text/plain"}
VALID_JSON_MIMETYPES = {"application/json", "text/json", "text/plain"}


# Response models
class ExportStats(BaseModel):
    """Export statistics."""

    vocabulary_count: int
    grammar_count: int
    exported_at: str


class ImportResult(BaseModel):
    """Import result."""

    success: bool
    vocabulary_imported: int
    vocabulary_skipped: int
    grammar_imported: int
    grammar_skipped: int
    errors: list[str]


class VocabExportItem(BaseModel):
    """Vocabulary export format."""

    kanji: str
    reading: Optional[str]
    meaning: Optional[str]
    pos: Optional[str]
    source_img: Optional[str]  # OCR source image path
    reps: int
    interval: int
    ease_factor: float
    next_review: Optional[str]
    created_at: str


class GrammarExportItem(BaseModel):
    """Grammar export format."""

    title: str
    meaning: Optional[str]
    description: Optional[str]
    example: Optional[str]
    example_meaning: Optional[str]
    level: Optional[str]
    created_at: str


# Export endpoints


@router.get("/vocab/csv")
def export_vocab_csv(db: Session = Depends(get_db)):
    """Export vocabulary as CSV file.

    FR-025: 단어장을 CSV 형태로 내보내기
    """
    # Query vocabulary with SRS data
    vocab_data = (
        db.query(Vocabulary, SRSReview)
        .outerjoin(SRSReview, Vocabulary.id == SRSReview.vocab_id)
        .all()
    )

    # Create CSV in memory
    output = StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(
        [
            "kanji",
            "reading",
            "meaning",
            "pos",
            "source_img",
            "reps",
            "interval",
            "ease_factor",
            "next_review",
            "created_at",
        ]
    )

    # Data rows
    for vocab, srs in vocab_data:
        writer.writerow(
            [
                vocab.kanji,
                vocab.reading or "",
                vocab.meaning or "",
                vocab.pos or "",
                vocab.source_img or "",
                srs.reps if srs else 0,
                srs.interval if srs else 1,
                srs.ease_factor if srs else 2.5,
                srs.next_review.isoformat() if srs and srs.next_review else "",
                vocab.created_at.isoformat() if vocab.created_at else "",
            ]
        )

    output.seek(0)

    # Return as downloadable file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"jflash_vocab_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/vocab/json")
def export_vocab_json(db: Session = Depends(get_db)):
    """Export vocabulary as JSON file.

    FR-025: 단어장을 JSON 형태로 내보내기
    """
    # Query vocabulary with SRS data
    vocab_data = (
        db.query(Vocabulary, SRSReview)
        .outerjoin(SRSReview, Vocabulary.id == SRSReview.vocab_id)
        .all()
    )

    items = []
    for vocab, srs in vocab_data:
        items.append(
            {
                "kanji": vocab.kanji,
                "reading": vocab.reading,
                "meaning": vocab.meaning,
                "pos": vocab.pos,
                "source_img": vocab.source_img,
                "reps": srs.reps if srs else 0,
                "interval": srs.interval if srs else 1,
                "ease_factor": srs.ease_factor if srs else 2.5,
                "next_review": srs.next_review.isoformat() if srs and srs.next_review else None,
                "created_at": vocab.created_at.isoformat() if vocab.created_at else None,
            }
        )

    export_data = {
        "version": "1.0",
        "type": "vocabulary",
        "exported_at": datetime.now().isoformat(),
        "count": len(items),
        "items": items,
    }

    output = json.dumps(export_data, ensure_ascii=False, indent=2)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"jflash_vocab_{timestamp}.json"

    return StreamingResponse(
        iter([output]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/grammar/csv")
def export_grammar_csv(db: Session = Depends(get_db)):
    """Export grammar as CSV file."""
    grammar_data = db.query(Grammar).all()

    output = StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(
        [
            "title",
            "meaning",
            "description",
            "example",
            "example_meaning",
            "level",
            "created_at",
        ]
    )

    # Data rows
    for g in grammar_data:
        writer.writerow(
            [
                g.title,
                g.meaning or "",
                g.description or "",
                g.example or "",
                g.example_meaning or "",
                g.level or "",
                g.created_at.isoformat() if g.created_at else "",
            ]
        )

    output.seek(0)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"jflash_grammar_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/grammar/json")
def export_grammar_json(db: Session = Depends(get_db)):
    """Export grammar as JSON file."""
    grammar_data = db.query(Grammar).all()

    items = []
    for g in grammar_data:
        items.append(
            {
                "title": g.title,
                "meaning": g.meaning,
                "description": g.description,
                "example": g.example,
                "example_meaning": g.example_meaning,
                "level": g.level,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
        )

    export_data = {
        "version": "1.0",
        "type": "grammar",
        "exported_at": datetime.now().isoformat(),
        "count": len(items),
        "items": items,
    }

    output = json.dumps(export_data, ensure_ascii=False, indent=2)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"jflash_grammar_{timestamp}.json"

    return StreamingResponse(
        iter([output]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/all/json")
def export_all_json(db: Session = Depends(get_db)):
    """Export all data (vocabulary + grammar) as JSON file."""
    # Vocabulary
    vocab_data = (
        db.query(Vocabulary, SRSReview)
        .outerjoin(SRSReview, Vocabulary.id == SRSReview.vocab_id)
        .all()
    )

    vocab_items = []
    for vocab, srs in vocab_data:
        vocab_items.append(
            {
                "kanji": vocab.kanji,
                "reading": vocab.reading,
                "meaning": vocab.meaning,
                "pos": vocab.pos,
                "source_img": vocab.source_img,
                "reps": srs.reps if srs else 0,
                "interval": srs.interval if srs else 1,
                "ease_factor": srs.ease_factor if srs else 2.5,
                "next_review": srs.next_review.isoformat() if srs and srs.next_review else None,
                "created_at": vocab.created_at.isoformat() if vocab.created_at else None,
            }
        )

    # Grammar
    grammar_data = db.query(Grammar).all()

    grammar_items = []
    for g in grammar_data:
        grammar_items.append(
            {
                "title": g.title,
                "meaning": g.meaning,
                "description": g.description,
                "example": g.example,
                "example_meaning": g.example_meaning,
                "level": g.level,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
        )

    export_data = {
        "version": "1.0",
        "type": "full_backup",
        "exported_at": datetime.now().isoformat(),
        "vocabulary": {"count": len(vocab_items), "items": vocab_items},
        "grammar": {"count": len(grammar_items), "items": grammar_items},
    }

    output = json.dumps(export_data, ensure_ascii=False, indent=2)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"jflash_backup_{timestamp}.json"

    return StreamingResponse(
        iter([output]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# Import endpoints


def _validate_csv_file(file: UploadFile) -> None:
    """Validate CSV file extension and MIME type."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="CSV 파일만 업로드 가능합니다.")

    # MIME type validation (content_type may be None or generic)
    if file.content_type and file.content_type not in VALID_CSV_MIMETYPES:
        raise HTTPException(
            status_code=400,
            detail=f"유효하지 않은 파일 형식입니다. (받은 형식: {file.content_type})"
        )


def _validate_json_file(file: UploadFile) -> None:
    """Validate JSON file extension and MIME type."""
    if not file.filename or not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="JSON 파일만 업로드 가능합니다.")

    if file.content_type and file.content_type not in VALID_JSON_MIMETYPES:
        raise HTTPException(
            status_code=400,
            detail=f"유효하지 않은 파일 형식입니다. (받은 형식: {file.content_type})"
        )


def _check_vocab_duplicate(
    db: Session, kanji: str, reading: str | None, meaning: str | None
) -> bool:
    """Check if vocabulary exists using composite key (kanji+reading+meaning).

    Same kanji with different reading/meaning is treated as different entry.
    Example: 生 (なま/raw) vs 生 (せい/life) are separate entries.
    """
    query = db.query(Vocabulary).filter(Vocabulary.kanji == kanji)

    # Handle None values in comparison
    if reading is None:
        query = query.filter(Vocabulary.reading.is_(None))
    else:
        query = query.filter(Vocabulary.reading == reading)

    if meaning is None:
        query = query.filter(Vocabulary.meaning.is_(None))
    else:
        query = query.filter(Vocabulary.meaning == meaning)

    return query.first() is not None


def _check_grammar_duplicate(
    db: Session, title: str, meaning: str | None
) -> bool:
    """Check if grammar exists using composite key (title+meaning).

    Same title with different meaning is treated as different entry.
    """
    query = db.query(Grammar).filter(Grammar.title == title)

    if meaning is None:
        query = query.filter(Grammar.meaning.is_(None))
    else:
        query = query.filter(Grammar.meaning == meaning)

    return query.first() is not None


@router.post("/vocab/csv", response_model=ImportResult)
async def import_vocab_csv(
    file: UploadFile = File(...),
    skip_duplicates: bool = Query(True, description="Skip words that already exist"),
    db: Session = Depends(get_db),
):
    """Import vocabulary from CSV file.

    FR-026: 외부에서 만든 단어장 가져오기

    Expected CSV format:
    kanji,reading,meaning,pos[,source_img]

    Duplicate detection uses composite key (kanji+reading+meaning).
    Same kanji with different reading/meaning is imported as separate entry.
    """
    _validate_csv_file(file)

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode(FALLBACK_ENCODING)

    reader = csv.DictReader(StringIO(text))

    imported = 0
    skipped = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            kanji = row.get("kanji", "").strip()
            if not kanji:
                errors.append(f"Row {row_num}: kanji 필드가 비어있습니다.")
                continue

            reading = row.get("reading", "").strip() or None
            meaning = row.get("meaning", "").strip() or None

            # Check for duplicates using composite key
            if skip_duplicates:
                if _check_vocab_duplicate(db, kanji, reading, meaning):
                    skipped += 1
                    continue

            # Create vocabulary
            vocab = Vocabulary(
                kanji=kanji,
                reading=reading,
                meaning=meaning,
                pos=row.get("pos", "").strip() or None,
                source_img=row.get("source_img", "").strip() or None,
            )
            db.add(vocab)
            db.flush()

            # Create SRS review
            srs = SRSReview(vocab_id=vocab.id)
            db.add(srs)

            imported += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    db.commit()

    return ImportResult(
        success=True,
        vocabulary_imported=imported,
        vocabulary_skipped=skipped,
        grammar_imported=0,
        grammar_skipped=0,
        errors=errors[:MAX_ERRORS_IN_RESPONSE],
    )


@router.post("/vocab/json", response_model=ImportResult)
async def import_vocab_json(
    file: UploadFile = File(...),
    skip_duplicates: bool = Query(True, description="Skip words that already exist"),
    db: Session = Depends(get_db),
):
    """Import vocabulary from JSON file.

    FR-026: 외부에서 만든 단어장 가져오기

    Expected JSON format:
    {
        "items": [
            {"kanji": "...", "reading": "...", "meaning": "...", "pos": "...", "source_img": "..."}
        ]
    }

    Duplicate detection uses composite key (kanji+reading+meaning).
    """
    _validate_json_file(file)

    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise HTTPException(status_code=400, detail=f"JSON 파싱 오류: {str(e)}")

    items = data.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="items 배열이 비어있습니다.")

    imported = 0
    skipped = 0
    errors = []

    for idx, item in enumerate(items):
        try:
            kanji = str(item.get("kanji", "")).strip()
            if not kanji:
                errors.append(f"Item {idx}: kanji 필드가 비어있습니다.")
                continue

            reading = item.get("reading")
            meaning = item.get("meaning")

            # Check for duplicates using composite key
            if skip_duplicates:
                if _check_vocab_duplicate(db, kanji, reading, meaning):
                    skipped += 1
                    continue

            # Create vocabulary
            vocab = Vocabulary(
                kanji=kanji,
                reading=reading,
                meaning=meaning,
                pos=item.get("pos"),
                source_img=item.get("source_img"),
            )
            db.add(vocab)
            db.flush()

            # Create SRS review
            srs = SRSReview(vocab_id=vocab.id)
            db.add(srs)

            imported += 1

        except Exception as e:
            errors.append(f"Item {idx}: {str(e)}")

    db.commit()

    return ImportResult(
        success=True,
        vocabulary_imported=imported,
        vocabulary_skipped=skipped,
        grammar_imported=0,
        grammar_skipped=0,
        errors=errors[:MAX_ERRORS_IN_RESPONSE],
    )


@router.post("/grammar/csv", response_model=ImportResult)
async def import_grammar_csv(
    file: UploadFile = File(...),
    skip_duplicates: bool = Query(True, description="Skip grammar that already exists"),
    db: Session = Depends(get_db),
):
    """Import grammar from CSV file.

    Duplicate detection uses composite key (title+meaning).
    Same title with different meaning is imported as separate entry.
    """
    _validate_csv_file(file)

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode(FALLBACK_ENCODING)

    reader = csv.DictReader(StringIO(text))

    imported = 0
    skipped = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            title = row.get("title", "").strip()
            if not title:
                errors.append(f"Row {row_num}: title 필드가 비어있습니다.")
                continue

            meaning = row.get("meaning", "").strip() or None

            # Check for duplicates using composite key
            if skip_duplicates:
                if _check_grammar_duplicate(db, title, meaning):
                    skipped += 1
                    continue

            # Create grammar
            grammar = Grammar(
                title=title,
                meaning=meaning,
                description=row.get("description", "").strip() or None,
                example=row.get("example", "").strip() or None,
                example_meaning=row.get("example_meaning", "").strip() or None,
                level=row.get("level", "").strip() or None,
            )
            db.add(grammar)
            imported += 1

        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    db.commit()

    return ImportResult(
        success=True,
        vocabulary_imported=0,
        vocabulary_skipped=0,
        grammar_imported=imported,
        grammar_skipped=skipped,
        errors=errors[:MAX_ERRORS_IN_RESPONSE],
    )


@router.post("/grammar/json", response_model=ImportResult)
async def import_grammar_json(
    file: UploadFile = File(...),
    skip_duplicates: bool = Query(True, description="Skip grammar that already exists"),
    db: Session = Depends(get_db),
):
    """Import grammar from JSON file.

    Duplicate detection uses composite key (title+meaning).
    """
    _validate_json_file(file)

    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise HTTPException(status_code=400, detail=f"JSON 파싱 오류: {str(e)}")

    items = data.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="items 배열이 비어있습니다.")

    imported = 0
    skipped = 0
    errors = []

    for idx, item in enumerate(items):
        try:
            title = str(item.get("title", "")).strip()
            if not title:
                errors.append(f"Item {idx}: title 필드가 비어있습니다.")
                continue

            meaning = item.get("meaning")

            # Check for duplicates using composite key
            if skip_duplicates:
                if _check_grammar_duplicate(db, title, meaning):
                    skipped += 1
                    continue

            # Create grammar
            grammar = Grammar(
                title=title,
                meaning=meaning,
                description=item.get("description"),
                example=item.get("example"),
                example_meaning=item.get("example_meaning"),
                level=item.get("level"),
            )
            db.add(grammar)
            imported += 1

        except Exception as e:
            errors.append(f"Item {idx}: {str(e)}")

    db.commit()

    return ImportResult(
        success=True,
        vocabulary_imported=0,
        vocabulary_skipped=0,
        grammar_imported=imported,
        grammar_skipped=skipped,
        errors=errors[:MAX_ERRORS_IN_RESPONSE],
    )


@router.post("/all/json", response_model=ImportResult)
async def import_all_json(
    file: UploadFile = File(...),
    skip_duplicates: bool = Query(True, description="Skip items that already exist"),
    db: Session = Depends(get_db),
):
    """Import full backup (vocabulary + grammar) from JSON file.

    Duplicate detection:
    - Vocabulary: composite key (kanji+reading+meaning)
    - Grammar: composite key (title+meaning)
    """
    _validate_json_file(file)

    content = await file.read()
    try:
        data = json.loads(content.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise HTTPException(status_code=400, detail=f"JSON 파싱 오류: {str(e)}")

    vocab_imported = 0
    vocab_skipped = 0
    grammar_imported = 0
    grammar_skipped = 0
    errors = []

    # Import vocabulary
    vocab_items = data.get("vocabulary", {}).get("items", [])
    if not vocab_items and "items" in data:
        # Handle single-type export format
        if data.get("type") == "vocabulary":
            vocab_items = data.get("items", [])

    for idx, item in enumerate(vocab_items):
        try:
            kanji = str(item.get("kanji", "")).strip()
            if not kanji:
                continue

            reading = item.get("reading")
            meaning = item.get("meaning")

            # Check for duplicates using composite key
            if skip_duplicates:
                if _check_vocab_duplicate(db, kanji, reading, meaning):
                    vocab_skipped += 1
                    continue

            vocab = Vocabulary(
                kanji=kanji,
                reading=reading,
                meaning=meaning,
                pos=item.get("pos"),
                source_img=item.get("source_img"),
            )
            db.add(vocab)
            db.flush()

            srs = SRSReview(vocab_id=vocab.id)
            db.add(srs)

            vocab_imported += 1

        except Exception as e:
            errors.append(f"Vocab {idx}: {str(e)}")

    # Import grammar
    grammar_items = data.get("grammar", {}).get("items", [])
    if not grammar_items and "items" in data:
        if data.get("type") == "grammar":
            grammar_items = data.get("items", [])

    for idx, item in enumerate(grammar_items):
        try:
            title = str(item.get("title", "")).strip()
            if not title:
                continue

            meaning = item.get("meaning")

            # Check for duplicates using composite key
            if skip_duplicates:
                if _check_grammar_duplicate(db, title, meaning):
                    grammar_skipped += 1
                    continue

            grammar = Grammar(
                title=title,
                meaning=meaning,
                description=item.get("description"),
                example=item.get("example"),
                example_meaning=item.get("example_meaning"),
                level=item.get("level"),
            )
            db.add(grammar)
            grammar_imported += 1

        except Exception as e:
            errors.append(f"Grammar {idx}: {str(e)}")

    db.commit()

    return ImportResult(
        success=True,
        vocabulary_imported=vocab_imported,
        vocabulary_skipped=vocab_skipped,
        grammar_imported=grammar_imported,
        grammar_skipped=grammar_skipped,
        errors=errors[:MAX_ERRORS_IN_RESPONSE],
    )


# Stats endpoint


@router.get("/stats", response_model=ExportStats)
def get_export_stats(db: Session = Depends(get_db)):
    """Get counts for export preview."""
    vocab_count = db.query(func.count(Vocabulary.id)).scalar() or 0
    grammar_count = db.query(func.count(Grammar.id)).scalar() or 0

    return ExportStats(
        vocabulary_count=vocab_count,
        grammar_count=grammar_count,
        exported_at=datetime.now().isoformat(),
    )
