"""Database initialization script.

Creates all database tables defined in SQLAlchemy models.
"""

from pathlib import Path

from database import Base, engine, DATA_DIR
from models import Vocabulary, SRSReview, Grammar, Kanji, StudyLog


def init_database() -> None:
    """Create all database tables."""
    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print(f"Database initialized at: {DATA_DIR / 'japanese_learning.db'}")
    print("Tables created: Vocabulary, SRS_Review, Grammar, Kanji, Study_Log")


if __name__ == "__main__":
    init_database()
