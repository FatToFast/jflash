"""Kanji model for storing Japanese kanji information."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Kanji(Base):
    """Kanji model for storing kanji character information."""

    __tablename__ = "Kanji"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    character: Mapped[str] = mapped_column(String(10), nullable=False, unique=True, index=True)
    stroke_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    grade: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 학년별 한자 등급
    jlpt_level: Mapped[int | None] = mapped_column(Integer, nullable=True)  # JLPT 레벨 (1-5)
    frequency: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 사용 빈도 순위

    # 읽기
    on_readings: Mapped[str | None] = mapped_column(Text, nullable=True)  # 음독 (쉼표 구분)
    kun_readings: Mapped[str | None] = mapped_column(Text, nullable=True)  # 훈독 (쉼표 구분)

    # 의미
    meanings: Mapped[str | None] = mapped_column(Text, nullable=True)  # 의미 (쉼표 구분)
    meanings_ko: Mapped[str | None] = mapped_column(Text, nullable=True)  # 한국어 의미

    # 부수
    radical: Mapped[str | None] = mapped_column(String(10), nullable=True)
    radical_name: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp()
    )
