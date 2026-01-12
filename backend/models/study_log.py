"""Study Log model for tracking learning sessions."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class StudyLog(Base):
    """Study Log model for tracking individual review sessions."""

    __tablename__ = "Study_Log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vocab_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("Vocabulary.id", ondelete="CASCADE"), nullable=False
    )
    known: Mapped[bool] = mapped_column(Boolean, nullable=False)  # True=알아요, False=몰라요
    studied_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp()
    )
