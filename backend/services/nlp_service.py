from __future__ import annotations

from functools import lru_cache


@lru_cache(maxsize=1)
def get_tagger():
    from fugashi import Tagger

    return Tagger()


def extract_words(text: str) -> list[dict]:
    if not text.strip():
        return []

    try:
        tagger = get_tagger()
    except Exception:
        return [{"kanji": text.strip(), "reading": None, "pos": None}]

    words: list[dict] = []
    for token in tagger(text):
        surface = token.surface
        reading = getattr(token.feature, "kana", None) or getattr(
            token.feature, "reading", None
        )
        pos = getattr(token.feature, "pos1", None)

        words.append(
            {
                "kanji": surface,
                "reading": None if reading in (None, "*") else str(reading),
                "pos": None if pos in (None, "*") else str(pos),
            }
        )

    return words
