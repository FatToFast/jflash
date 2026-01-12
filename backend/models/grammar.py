"""Grammar model for storing Japanese grammar points."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Grammar(Base):
    """Grammar model for storing Japanese grammar points."""

    __tablename__ = "Grammar"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)  # 문법 제목 (예: ～ている)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)  # 문법 설명 및 용법
    example_jp: Mapped[str | None] = mapped_column(Text, nullable=True)  # 일본어 예문
    example_kr: Mapped[str | None] = mapped_column(Text, nullable=True)  # 예문 해석 (한국어)
    level: Mapped[str | None] = mapped_column(String(10), nullable=True)  # JLPT 레벨 (N5~N1)
    similar_patterns: Mapped[str | None] = mapped_column(Text, nullable=True)  # 유사 문법
    usage_notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # 사용 주의사항
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp()
    )
