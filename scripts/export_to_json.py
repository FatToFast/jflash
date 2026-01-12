#!/usr/bin/env python3
"""
Export SQLite data to JSON for Vercel deployment.

Usage:
    python scripts/export_to_json.py

This script reads from the SQLite database and exports vocabulary and grammar
data to JSON files in the frontend/public/data/ directory.
"""

import json
import sqlite3
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DB_PATH = PROJECT_ROOT / "data" / "japanese_learning.db"
OUTPUT_DIR = PROJECT_ROOT / "frontend" / "public" / "data"


def export_vocabulary(conn: sqlite3.Connection) -> list[dict]:
    """Export vocabulary table to list of dicts."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, kanji, reading, meaning, pos, jlpt_level,
               example_sentence, example_meaning
        FROM Vocabulary
        ORDER BY id
    """)

    columns = ["id", "kanji", "reading", "meaning", "pos", "jlpt_level",
               "example_sentence", "example_meaning"]

    rows = cursor.fetchall()
    return [dict(zip(columns, row)) for row in rows]


def export_grammar(conn: sqlite3.Connection) -> list[dict]:
    """Export grammar table to list of dicts."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, title, explanation, example_jp, example_kr, level
        FROM Grammar
        ORDER BY id
    """)

    columns = ["id", "title", "explanation", "example_jp", "example_kr", "level"]

    rows = cursor.fetchall()
    return [dict(zip(columns, row)) for row in rows]


def main():
    # Check if database exists
    if not DB_PATH.exists():
        print(f"Error: Database not found at {DB_PATH}")
        return 1

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Connect to database
    conn = sqlite3.connect(DB_PATH)

    try:
        # Export vocabulary
        vocab = export_vocabulary(conn)
        vocab_path = OUTPUT_DIR / "vocabulary.json"
        with open(vocab_path, "w", encoding="utf-8") as f:
            json.dump(vocab, f, ensure_ascii=False, indent=2)
        print(f"Exported {len(vocab)} vocabulary items to {vocab_path}")

        # Export grammar
        grammar = export_grammar(conn)
        grammar_path = OUTPUT_DIR / "grammar.json"
        with open(grammar_path, "w", encoding="utf-8") as f:
            json.dump(grammar, f, ensure_ascii=False, indent=2)
        print(f"Exported {len(grammar)} grammar items to {grammar_path}")

        print("\nExport complete!")
        return 0

    finally:
        conn.close()


if __name__ == "__main__":
    exit(main())
