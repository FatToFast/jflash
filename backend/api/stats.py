"""Statistics API endpoints for learning dashboard."""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, case, and_, extract
from sqlalchemy.orm import Session

from database import get_db
from models.grammar import Grammar
from models.study_log import StudyLog
from models.vocabulary import SRSReview, Vocabulary

router = APIRouter()

# Statistics configuration constants
DASHBOARD_DAILY_STATS_DAYS = 7
DASHBOARD_ACCURACY_TREND_DAYS = 14
MASTERY_THRESHOLD_REPS = 5  # reps count to consider a word "mastered"


# Response models
class OverviewStats(BaseModel):
    """Overall learning statistics."""

    total_words: int
    learned_words: int  # reps > 0
    mastered_words: int  # reps >= 5
    new_words: int  # reps == 0
    due_today: int
    total_grammar: int
    learning_progress: float  # percentage


class DailyStats(BaseModel):
    """Daily learning statistics."""

    date: str
    total_reviews: int
    correct: int
    incorrect: int
    accuracy: float
    new_words_learned: int


class AccuracyData(BaseModel):
    """Accuracy data for graphing."""

    dates: list[str]
    accuracy: list[float]
    total_reviews: list[int]


class StreakInfo(BaseModel):
    """Learning streak information."""

    current_streak: int
    longest_streak: int
    last_study_date: Optional[str]


class DashboardResponse(BaseModel):
    """Complete dashboard data."""

    overview: OverviewStats
    recent_daily_stats: list[DailyStats]
    accuracy_trend: AccuracyData
    streak: StreakInfo


@router.get("/overview", response_model=OverviewStats)
def get_overview_stats(db: Session = Depends(get_db)) -> OverviewStats:
    """Get overall learning statistics.

    FR-022: 전체 단어 수, 학습 진행도 표시
    """
    # Total words
    total_words = db.query(func.count(Vocabulary.id)).scalar() or 0

    # Words by learning status
    learned_words = (
        db.query(func.count(SRSReview.id))
        .filter(SRSReview.reps > 0)
        .scalar()
        or 0
    )

    mastered_words = (
        db.query(func.count(SRSReview.id))
        .filter(SRSReview.reps >= MASTERY_THRESHOLD_REPS)
        .scalar()
        or 0
    )

    new_words = total_words - learned_words

    # Due today: items scheduled until end of today
    now = datetime.now()
    today_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    due_today = (
        db.query(func.count(SRSReview.id))
        .filter(SRSReview.next_review <= today_end)
        .scalar()
        or 0
    )

    # Total grammar
    total_grammar = db.query(func.count(Grammar.id)).scalar() or 0

    # Learning progress (percentage of words learned at least once)
    learning_progress = (learned_words / total_words * 100) if total_words > 0 else 0

    return OverviewStats(
        total_words=total_words,
        learned_words=learned_words,
        mastered_words=mastered_words,
        new_words=new_words,
        due_today=due_today,
        total_grammar=total_grammar,
        learning_progress=round(learning_progress, 1),
    )


@router.get("/daily", response_model=list[DailyStats])
def get_daily_stats(
    days: int = Query(7, ge=1, le=30, description="Number of days to retrieve"),
    db: Session = Depends(get_db),
) -> list[DailyStats]:
    """Get daily learning statistics.

    FR-023: 일별 학습 통계
    Optimized: single query for all dates instead of N+1 queries
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=days - 1)

    # Single query for daily review stats grouped by date
    daily_stats_query = (
        db.query(
            func.date(StudyLog.studied_at).label("study_date"),
            func.count(StudyLog.id).label("total"),
            func.sum(case((StudyLog.known == True, 1), else_=0)).label("correct"),
            func.sum(case((StudyLog.known == False, 1), else_=0)).label("incorrect"),
        )
        .filter(StudyLog.studied_at >= start_date)
        .group_by(func.date(StudyLog.studied_at))
        .all()
    )

    # Convert to dict for O(1) lookup
    stats_by_date = {
        row.study_date: {
            "total": row.total or 0,
            "correct": int(row.correct or 0),
            "incorrect": int(row.incorrect or 0),
        }
        for row in daily_stats_query
    }

    # Single query for first successful reviews grouped by date
    first_success_subq = (
        db.query(
            StudyLog.vocab_id,
            func.min(StudyLog.studied_at).label("first_success")
        )
        .filter(StudyLog.known == True)
        .group_by(StudyLog.vocab_id)
        .subquery()
    )

    new_words_query = (
        db.query(
            func.date(first_success_subq.c.first_success).label("success_date"),
            func.count(first_success_subq.c.vocab_id).label("count"),
        )
        .filter(first_success_subq.c.first_success >= start_date)
        .group_by(func.date(first_success_subq.c.first_success))
        .all()
    )

    new_words_by_date = {row.success_date: row.count for row in new_words_query}

    # Build result for all requested days
    result = []
    for i in range(days - 1, -1, -1):  # From oldest to newest
        date = today - timedelta(days=i)
        date_key = date.date()

        stats = stats_by_date.get(date_key, {"total": 0, "correct": 0, "incorrect": 0})
        total = stats["total"]
        correct = stats["correct"]
        incorrect = stats["incorrect"]
        accuracy = (correct / total * 100) if total > 0 else 0
        new_learned = new_words_by_date.get(date_key, 0)

        result.append(
            DailyStats(
                date=date.strftime("%Y-%m-%d"),
                total_reviews=total,
                correct=correct,
                incorrect=incorrect,
                accuracy=round(accuracy, 1),
                new_words_learned=new_learned,
            )
        )

    return result


@router.get("/accuracy", response_model=AccuracyData)
def get_accuracy_trend(
    days: int = Query(14, ge=7, le=90, description="Number of days for trend"),
    db: Session = Depends(get_db),
) -> AccuracyData:
    """Get accuracy trend for graphing.

    FR-024: 정답률 그래프
    Optimized: single query for all dates instead of N+1 queries
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = today - timedelta(days=days - 1)

    # Single query for all dates
    daily_stats_query = (
        db.query(
            func.date(StudyLog.studied_at).label("study_date"),
            func.count(StudyLog.id).label("total"),
            func.sum(case((StudyLog.known == True, 1), else_=0)).label("correct"),
        )
        .filter(StudyLog.studied_at >= start_date)
        .group_by(func.date(StudyLog.studied_at))
        .all()
    )

    # Convert to dict for O(1) lookup
    stats_by_date = {
        row.study_date: {"total": row.total or 0, "correct": int(row.correct or 0)}
        for row in daily_stats_query
    }

    # Build result for all requested days
    dates = []
    accuracy_list = []
    total_reviews_list = []

    for i in range(days - 1, -1, -1):  # From oldest to newest
        date = today - timedelta(days=i)
        date_key = date.date()

        stats = stats_by_date.get(date_key, {"total": 0, "correct": 0})
        total = stats["total"]
        correct = stats["correct"]
        accuracy = (correct / total * 100) if total > 0 else 0

        dates.append(date.strftime("%m/%d"))
        accuracy_list.append(round(accuracy, 1))
        total_reviews_list.append(total)

    return AccuracyData(
        dates=dates,
        accuracy=accuracy_list,
        total_reviews=total_reviews_list,
    )


@router.get("/streak", response_model=StreakInfo)
def get_streak_info(db: Session = Depends(get_db)) -> StreakInfo:
    """Get learning streak information."""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    # Get all unique study dates
    study_dates = (
        db.query(func.date(StudyLog.studied_at))
        .distinct()
        .order_by(func.date(StudyLog.studied_at).desc())
        .all()
    )

    if not study_dates:
        return StreakInfo(
            current_streak=0,
            longest_streak=0,
            last_study_date=None,
        )

    # Convert to date objects
    dates = [d[0] for d in study_dates if d[0] is not None]
    if not dates:
        return StreakInfo(
            current_streak=0,
            longest_streak=0,
            last_study_date=None,
        )

    # Calculate current streak
    current_streak = 0
    check_date = today.date()

    for d in dates:
        if d == check_date or d == check_date - timedelta(days=1):
            current_streak += 1
            check_date = d - timedelta(days=1)
        else:
            break

    # Calculate longest streak
    longest_streak = 1
    current_run = 1
    sorted_dates = sorted(dates, reverse=True)

    for i in range(1, len(sorted_dates)):
        if sorted_dates[i - 1] - sorted_dates[i] == timedelta(days=1):
            current_run += 1
            longest_streak = max(longest_streak, current_run)
        else:
            current_run = 1

    return StreakInfo(
        current_streak=current_streak,
        longest_streak=max(longest_streak, current_streak),
        last_study_date=dates[0].strftime("%Y-%m-%d") if dates else None,
    )


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)) -> DashboardResponse:
    """Get complete dashboard data in one request."""
    overview = get_overview_stats(db)
    daily_stats = get_daily_stats(days=DASHBOARD_DAILY_STATS_DAYS, db=db)
    accuracy = get_accuracy_trend(days=DASHBOARD_ACCURACY_TREND_DAYS, db=db)
    streak = get_streak_info(db)

    return DashboardResponse(
        overview=overview,
        recent_daily_stats=daily_stats,
        accuracy_trend=accuracy,
        streak=streak,
    )
