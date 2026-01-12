"""Morphological analysis service using Fugashi (MeCab) for Japanese text.

Story 2.3: 형태소 분석 및 단어 추출
- Fugashi로 일본어 텍스트를 형태소 단위로 분리
- 각 단어의 한자, 읽기(후리가나), 품사 추출
- 조사, 기호 등 불필요한 요소 필터링
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from typing import List, Optional

logger = logging.getLogger(__name__)


class PosCategory(str, Enum):
    """Part of speech categories."""

    NOUN = "名詞"
    VERB = "動詞"
    ADJECTIVE = "形容詞"
    ADVERB = "副詞"
    PARTICLE = "助詞"
    AUX_VERB = "助動詞"
    SYMBOL = "記号"
    AUX_SYMBOL = "補助記号"
    CONJUNCTION = "接続詞"
    INTERJECTION = "感動詞"
    PRENOUN = "連体詞"
    PREFIX = "接頭辞"
    SUFFIX = "接尾辞"
    UNKNOWN = "不明"


# Parts of speech to include in results (학습 대상)
INCLUDE_POS = {
    PosCategory.NOUN.value,
    PosCategory.VERB.value,
    PosCategory.ADJECTIVE.value,
    PosCategory.ADVERB.value,
    PosCategory.CONJUNCTION.value,
    PosCategory.INTERJECTION.value,
    PosCategory.PRENOUN.value,
}

# Parts of speech to exclude (문법 요소, 불필요)
EXCLUDE_POS = {
    PosCategory.PARTICLE.value,
    PosCategory.AUX_VERB.value,
    PosCategory.SYMBOL.value,
    PosCategory.AUX_SYMBOL.value,
    PosCategory.PREFIX.value,
    PosCategory.SUFFIX.value,
}


@dataclass(frozen=True)
class WordInfo:
    """Morphological analysis result for a single word."""

    surface: str  # 표층형 (원래 텍스트)
    reading: Optional[str]  # 읽기 (카타카나)
    pos: str  # 품사
    pos_detail: Optional[str]  # 품사 상세
    base_form: Optional[str]  # 기본형 (원형)
    is_content_word: bool  # 내용어 여부 (학습 대상)

    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "surface": self.surface,
            "reading": self.reading,
            "pos": self.pos,
            "pos_detail": self.pos_detail,
            "base_form": self.base_form,
            "is_content_word": self.is_content_word,
        }


@dataclass
class MorphologyResult:
    """Complete morphological analysis result."""

    success: bool
    words: List[WordInfo]
    total_count: int  # 전체 형태소 수
    filtered_count: int  # 필터링 후 단어 수
    processing_time_ms: int
    error: Optional[str] = None

    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "success": self.success,
            "words": [w.to_dict() for w in self.words],
            "total_count": self.total_count,
            "filtered_count": self.filtered_count,
            "processing_time_ms": self.processing_time_ms,
            "error": self.error,
        }


@lru_cache(maxsize=1)
def get_tagger():
    """Get cached Fugashi tagger instance.

    First call will load the unidic-lite dictionary.
    """
    import fugashi

    logger.info("Initializing Fugashi tagger (unidic-lite)...")
    tagger = fugashi.Tagger()
    logger.info("Fugashi tagger initialized successfully.")
    return tagger


def extract_word_info(word) -> WordInfo:
    """Extract word information from Fugashi token.

    Args:
        word: Fugashi token object.

    Returns:
        WordInfo with extracted data.
    """
    surface = word.surface

    # Get POS (품사)
    try:
        pos = word.pos.split(",")[0] if word.pos else PosCategory.UNKNOWN.value
    except (AttributeError, IndexError):
        pos = PosCategory.UNKNOWN.value

    # Get POS detail
    try:
        pos_parts = word.pos.split(",")
        pos_detail = ",".join(pos_parts[:2]) if len(pos_parts) >= 2 else pos
    except (AttributeError, IndexError):
        pos_detail = pos

    # Get reading (カタカナ)
    reading = None
    try:
        if hasattr(word, "feature") and hasattr(word.feature, "kana"):
            reading = word.feature.kana
    except (AttributeError, TypeError):
        pass

    # Get base form (原形)
    base_form = None
    try:
        if hasattr(word, "feature") and hasattr(word.feature, "lemma"):
            base_form = word.feature.lemma
    except (AttributeError, TypeError):
        base_form = surface

    # Determine if content word
    is_content_word = pos in INCLUDE_POS

    return WordInfo(
        surface=surface,
        reading=reading,
        pos=pos,
        pos_detail=pos_detail,
        base_form=base_form or surface,
        is_content_word=is_content_word,
    )


def analyze_morphology(
    text: str,
    filter_particles: bool = True,
    min_length: int = 1,
) -> MorphologyResult:
    """Analyze Japanese text morphologically.

    Args:
        text: Japanese text to analyze.
        filter_particles: Whether to filter out particles and symbols.
        min_length: Minimum character length for words.

    Returns:
        MorphologyResult with analyzed words.
    """
    start_time = time.time()

    try:
        if not text or not text.strip():
            return MorphologyResult(
                success=True,
                words=[],
                total_count=0,
                filtered_count=0,
                processing_time_ms=0,
            )

        # Get tagger and analyze
        tagger = get_tagger()
        tokens = tagger(text.strip())

        # Extract word info
        all_words: List[WordInfo] = []
        for token in tokens:
            word_info = extract_word_info(token)
            all_words.append(word_info)

        total_count = len(all_words)

        # Filter if requested
        if filter_particles:
            filtered_words = [
                w
                for w in all_words
                if w.is_content_word and len(w.surface) >= min_length
            ]
        else:
            filtered_words = [w for w in all_words if len(w.surface) >= min_length]

        filtered_count = len(filtered_words)

        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)

        logger.info(
            f"Morphology analysis completed: {total_count} tokens, "
            f"{filtered_count} words after filtering, {processing_time_ms}ms"
        )

        return MorphologyResult(
            success=True,
            words=filtered_words,
            total_count=total_count,
            filtered_count=filtered_count,
            processing_time_ms=processing_time_ms,
        )

    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        logger.exception(f"Morphology analysis failed: {e}")

        return MorphologyResult(
            success=False,
            words=[],
            total_count=0,
            filtered_count=0,
            processing_time_ms=processing_time_ms,
            error=str(e),
        )


def katakana_to_hiragana(text: str) -> str:
    """Convert katakana to hiragana.

    Args:
        text: Text containing katakana.

    Returns:
        Text with katakana converted to hiragana.
    """
    if not text:
        return ""

    result = []
    for char in text:
        code = ord(char)
        # Katakana range: U+30A0 - U+30FF
        # Hiragana range: U+3040 - U+309F
        if 0x30A1 <= code <= 0x30F6:
            result.append(chr(code - 0x60))
        else:
            result.append(char)

    return "".join(result)
