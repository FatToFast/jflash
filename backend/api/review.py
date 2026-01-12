"""SRS Review API endpoints.

Story 4.4: SRS 알고리즘 (SM-2 변형)
- 정답 시: interval 증가 (1 → 6 → interval * ease_factor)
- 오답 시: interval을 1로 리셋, ease_factor 감소
- reps는 정답 횟수를 누적 (오답 시 리셋하지 않음 - 설계 의도)

설계 의도 (reps 미리셋):
- reps는 "해당 단어를 맞춘 총 횟수"를 추적
- 오답 시에도 학습 이력을 보존하여 진행도 표시에 활용
- 표준 SM-2는 reps를 리셋하지만, 이 앱에서는 학습 이력 보존을 우선함
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

from database import get_db
from models.study_log import StudyLog
from models.vocabulary import SRSReview, Vocabulary

router = APIRouter()

# SM-2 Algorithm constants
MIN_EASE_FACTOR = 1.3
MAX_INTERVAL = 365


class ReviewCard(BaseModel):
    """Schema for a review card."""

    id: int
    vocab_id: int
    kanji: str
    reading: str | None
    meaning: str | None
    pos: str | None
    interval: int
    ease_factor: float
    reps: int
    # 복습 모드 확장 필드
    example_sentence: str | None = None  # 빈칸 모드용 예문
    example_meaning: str | None = None  # 예문 해석

    class Config:
        from_attributes = True


class ReviewCardsResponse(BaseModel):
    """Schema for review cards list response."""

    cards: list[ReviewCard]
    total: int


class AnswerRequest(BaseModel):
    """Schema for submitting an answer."""

    vocab_id: int
    known: bool


class AnswerResponse(BaseModel):
    """Schema for answer response."""

    vocab_id: int
    next_review: datetime
    new_interval: int
    ease_factor: float
    reps: int


@router.get("/cards", response_model=ReviewCardsResponse)
def get_review_cards(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ReviewCardsResponse:
    """Get cards due for review today."""
    now = datetime.now()

    # Use selectinload to prevent N+1 queries when accessing vocabulary
    cards = (
        db.query(SRSReview)
        .join(Vocabulary)
        .options(selectinload(SRSReview.vocabulary))
        .filter(SRSReview.next_review <= now)
        .order_by(SRSReview.next_review.asc())
        .limit(limit)
        .all()
    )

    total_due = (
        db.query(SRSReview).filter(SRSReview.next_review <= now).count()
    )

    return ReviewCardsResponse(
        cards=[
            ReviewCard(
                id=card.id,
                vocab_id=card.vocab_id,
                kanji=card.vocabulary.kanji,
                reading=card.vocabulary.reading,
                meaning=card.vocabulary.meaning,
                pos=card.vocabulary.pos,
                interval=card.interval,
                ease_factor=card.ease_factor,
                reps=card.reps,
                example_sentence=card.vocabulary.example_sentence,
                example_meaning=card.vocabulary.example_meaning,
            )
            for card in cards
        ],
        total=total_due,
    )


@router.post("/answer", response_model=AnswerResponse)
def submit_answer(
    data: AnswerRequest,
    db: Session = Depends(get_db),
) -> AnswerResponse:
    """Submit an answer for a vocabulary card and update SRS schedule."""
    srs = db.query(SRSReview).filter(SRSReview.vocab_id == data.vocab_id).first()
    if not srs:
        raise HTTPException(status_code=404, detail="SRS record not found")

    now = datetime.now()

    # Record study log for statistics
    study_log = StudyLog(
        vocab_id=data.vocab_id,
        known=data.known,
        studied_at=now,
    )
    db.add(study_log)

    if data.known:
        # Correct answer: increase interval using SM-2 algorithm
        if srs.reps == 0:
            new_interval = 1
        elif srs.reps == 1:
            new_interval = 6
        else:
            new_interval = round(srs.interval * srs.ease_factor)

        new_interval = min(new_interval, MAX_INTERVAL)
        new_ease = srs.ease_factor + 0.1

        srs.interval = new_interval
        srs.ease_factor = min(new_ease, 2.5)
        srs.reps += 1
    else:
        # Wrong answer: reset interval, decrease ease factor
        new_interval = 1
        new_ease = max(srs.ease_factor - 0.2, MIN_EASE_FACTOR)

        srs.interval = new_interval
        srs.ease_factor = new_ease
        # Don't reset reps, just reschedule

    srs.next_review = now + timedelta(days=srs.interval)
    db.commit()
    db.refresh(srs)

    return AnswerResponse(
        vocab_id=srs.vocab_id,
        next_review=srs.next_review,
        new_interval=srs.interval,
        ease_factor=srs.ease_factor,
        reps=srs.reps,
    )


@router.get("/stats")
def get_review_stats(db: Session = Depends(get_db)) -> dict:
    """Get review statistics."""
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_start = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)

    due_now = db.query(SRSReview).filter(SRSReview.next_review <= now).count()

    due_today = (
        db.query(SRSReview)
        .filter(
            SRSReview.next_review >= today_start,
            SRSReview.next_review < tomorrow_start,
        )
        .count()
    )

    due_week = (
        db.query(SRSReview)
        .filter(
            SRSReview.next_review >= today_start,
            SRSReview.next_review < week_end,
        )
        .count()
    )

    total_reviews = db.query(SRSReview).filter(SRSReview.reps > 0).count()

    return {
        "due_now": due_now,
        "due_today": due_today,
        "due_this_week": due_week,
        "total_reviewed": total_reviews,
    }


@router.post("/reset/{vocab_id}")
def reset_srs(
    vocab_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Reset SRS progress for a specific vocabulary."""
    srs = db.query(SRSReview).filter(SRSReview.vocab_id == vocab_id).first()
    if not srs:
        raise HTTPException(status_code=404, detail="SRS record not found")

    srs.interval = 0
    srs.ease_factor = 2.5
    srs.next_review = datetime.now()
    srs.reps = 0

    db.commit()

    return {"message": "SRS progress reset", "vocab_id": vocab_id}
