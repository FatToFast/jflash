"""OCR service using EasyOCR for Japanese text recognition.

Story 2.2: OCR 텍스트 인식
- EasyOCR 엔진으로 일본어 텍스트 인식
- 신뢰도 레벨 분류 (high/medium/low)
- 처리 시간 측정
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from enum import Enum
from functools import lru_cache
from pathlib import Path
from typing import List, Tuple

logger = logging.getLogger(__name__)


class ConfidenceLevel(str, Enum):
    """Confidence level classification for OCR results."""

    HIGH = "high"  # >= 0.8
    MEDIUM = "medium"  # 0.5 ~ 0.8
    LOW = "low"  # < 0.5


# Confidence thresholds
CONFIDENCE_HIGH_THRESHOLD = 0.8
CONFIDENCE_LOW_THRESHOLD = 0.5


@dataclass(frozen=True)
class OcrItem:
    """Single OCR recognition result."""

    text: str
    confidence: float
    confidence_level: ConfidenceLevel
    warning: bool
    bbox: Tuple[Tuple[int, int], ...] | None = None

    @classmethod
    def from_result(
        cls,
        text: str,
        confidence: float,
        bbox: list | None = None,
    ) -> "OcrItem":
        """Create OcrItem from EasyOCR result.

        Args:
            text: Recognized text.
            confidence: Confidence score (0.0 ~ 1.0).
            bbox: Bounding box coordinates.

        Returns:
            OcrItem with calculated confidence level.
        """
        if confidence >= CONFIDENCE_HIGH_THRESHOLD:
            level = ConfidenceLevel.HIGH
            warning = False
        elif confidence >= CONFIDENCE_LOW_THRESHOLD:
            level = ConfidenceLevel.MEDIUM
            warning = False
        else:
            level = ConfidenceLevel.LOW
            warning = True

        bbox_tuple = None
        if bbox:
            try:
                bbox_tuple = tuple(tuple(int(c) for c in point) for point in bbox)
            except (TypeError, ValueError):
                pass

        return cls(
            text=text,
            confidence=confidence,
            confidence_level=level,
            warning=warning,
            bbox=bbox_tuple,
        )


@dataclass
class OcrResult:
    """Complete OCR processing result."""

    success: bool
    results: List[OcrItem]
    full_text: str
    processing_time_ms: int
    error: str | None = None

    def to_dict(self) -> dict:
        """Convert to dictionary for API response."""
        return {
            "success": self.success,
            "results": [
                {
                    "text": item.text,
                    "confidence": round(item.confidence, 3),
                    "confidence_level": item.confidence_level.value,
                    "warning": item.warning,
                    "bbox": item.bbox,
                }
                for item in self.results
            ],
            "full_text": self.full_text,
            "processing_time_ms": self.processing_time_ms,
            "error": self.error,
        }


@lru_cache(maxsize=1)
def get_reader():
    """Get cached EasyOCR reader instance.

    First call will download Japanese model (~100MB).
    """
    import easyocr

    logger.info("Initializing EasyOCR reader (Japanese + English)...")
    reader = easyocr.Reader(["ja", "en"], gpu=False)
    logger.info("EasyOCR reader initialized successfully.")
    return reader


def run_ocr(image_path: Path) -> OcrResult:
    """Run OCR on an image file.

    Args:
        image_path: Path to the image file.

    Returns:
        OcrResult with recognized text and confidence levels.
    """
    import cv2

    start_time = time.time()

    try:
        # Validate image path
        if not image_path.exists():
            return OcrResult(
                success=False,
                results=[],
                full_text="",
                processing_time_ms=0,
                error=f"Image file not found: {image_path}",
            )

        # Validate image dimensions before OCR
        img = cv2.imread(str(image_path))
        if img is None:
            return OcrResult(
                success=False,
                results=[],
                full_text="",
                processing_time_ms=int((time.time() - start_time) * 1000),
                error="Failed to read image file. The file may be corrupted or in an unsupported format.",
            )

        height, width = img.shape[:2]
        MIN_DIMENSION = 10  # Minimum pixel size for OCR

        if height < MIN_DIMENSION or width < MIN_DIMENSION:
            return OcrResult(
                success=False,
                results=[],
                full_text="",
                processing_time_ms=int((time.time() - start_time) * 1000),
                error=f"Image too small for OCR: {width}x{height}px. Minimum size is {MIN_DIMENSION}x{MIN_DIMENSION}px.",
            )

        logger.info(f"Processing image: {width}x{height}px")

        # Get reader and run OCR
        reader = get_reader()
        raw_results = reader.readtext(str(image_path))

        # Process results
        items: List[OcrItem] = []
        for result in raw_results:
            if len(result) < 3:
                continue

            bbox, text, confidence = result
            if text is None or not str(text).strip():
                continue

            item = OcrItem.from_result(
                text=str(text).strip(),
                confidence=float(confidence),
                bbox=bbox,
            )
            items.append(item)

        # Build full text
        full_text = "\n".join(item.text for item in items).strip()

        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)

        logger.info(
            f"OCR completed: {len(items)} items, {processing_time_ms}ms, "
            f"text length: {len(full_text)}"
        )

        return OcrResult(
            success=True,
            results=items,
            full_text=full_text,
            processing_time_ms=processing_time_ms,
        )

    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        logger.exception(f"OCR processing failed: {e}")

        return OcrResult(
            success=False,
            results=[],
            full_text="",
            processing_time_ms=processing_time_ms,
            error=str(e),
        )


def run_ocr_legacy(image_path: Path) -> tuple[str, list[OcrItem]]:
    """Legacy interface for backward compatibility.

    Args:
        image_path: Path to the image file.

    Returns:
        Tuple of (full_text, list of OcrItem).
    """
    result = run_ocr(image_path)
    return result.full_text, result.results
