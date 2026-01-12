"""Vocabulary and SRS Review models."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, LargeBinary, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Vocabulary(Base):
    """Vocabulary model for storing Japanese words."""

    __tablename__ = "Vocabulary"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kanji: Mapped[str] = mapped_column(String, nullable=False)
    reading: Mapped[str | None] = mapped_column(String, nullable=True)
    meaning: Mapped[str | None] = mapped_column(String, nullable=True)
    pos: Mapped[str | None] = mapped_column(String, nullable=True)
    source_img: Mapped[str | None] = mapped_column(String, nullable=True)
    source_img_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp()
    )
    # 확장 필드 (LLM 추출 가이드라인 지원)
    jlpt_level: Mapped[str | None] = mapped_column(String, nullable=True)  # N5~N1
    example_sentence: Mapped[str | None] = mapped_column(String, nullable=True)  # 예문
    example_meaning: Mapped[str | None] = mapped_column(String, nullable=True)  # 예문 해석
    source_context: Mapped[str | None] = mapped_column(String, nullable=True)  # 출처 (교재/페이지)
    confidence: Mapped[float | None] = mapped_column(Float, default=1.0)  # LLM 신뢰도 0~1
    surface: Mapped[str | None] = mapped_column(String, nullable=True)  # 원문 표기 (활용형)
    needs_review: Mapped[int | None] = mapped_column(Integer, default=0)  # 수동 검토 필요 여부

    srs_review: Mapped["SRSReview | None"] = relationship(
        "SRSReview", back_populates="vocabulary", uselist=False, cascade="all, delete"
    )


class SRSReview(Base):
    """SRS Review model for spaced repetition scheduling."""

    __tablename__ = "SRS_Review"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vocab_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("Vocabulary.id", ondelete="CASCADE"), nullable=False
    )
    interval: Mapped[int] = mapped_column(Integer, default=0)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    next_review: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp()
    )
    reps: Mapped[int] = mapped_column(Integer, default=0)

    vocabulary: Mapped["Vocabulary"] = relationship(
        "Vocabulary", back_populates="srs_review"
    )
