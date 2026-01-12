"""OCR processing API router.

Story 2.2: OCR 텍스트 인식
- POST /api/ocr/process: 이미지에서 일본어 텍스트 인식
"""

import asyncio
import logging
import os
import re
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.ocr_service import run_ocr

router = APIRouter()
logger = logging.getLogger(__name__)

# Timeout for OCR processing (configurable via environment variable)
# Default: 60 seconds (allows for first-time model loading)
# After model is cached: typically 2-5 seconds per image
OCR_TIMEOUT_SECONDS = int(os.getenv("OCR_TIMEOUT_SECONDS", "60"))

# Upload directory (same as upload.py)
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"

# Valid filename pattern (UUID hex + extension)
VALID_FILENAME_PATTERN = re.compile(r"^[a-f0-9]{32}\.(jpg|jpeg|png)$", re.IGNORECASE)


class OcrProcessRequest(BaseModel):
    """Request schema for OCR processing."""

    image_path: str = Field(..., description="Path to uploaded image (e.g., /uploads/abc123.jpg)")


class OcrResultItem(BaseModel):
    """Single OCR result item."""

    text: str
    confidence: float
    confidence_level: str  # high, medium, low
    warning: bool
    bbox: Optional[List[List[int]]] = None


class OcrProcessResponse(BaseModel):
    """Response schema for OCR processing."""

    success: bool
    results: List[OcrResultItem]
    full_text: str
    processing_time_ms: int
    error: Optional[str] = None


def validate_and_resolve_path(image_path: str) -> Path:
    """Validate and resolve image path securely.

    Prevents path traversal attacks by:
    1. Only allowing /uploads/ prefix
    2. Validating filename format (UUID hex + extension)
    3. Resolving and checking the path is within UPLOAD_DIR

    Args:
        image_path: User-provided image path.

    Returns:
        Resolved Path object within UPLOAD_DIR.

    Raises:
        HTTPException: If path is invalid or outside UPLOAD_DIR.
    """
    # Extract filename from path
    if image_path.startswith("/uploads/"):
        filename = image_path[9:]  # Remove "/uploads/" prefix
    elif "/" not in image_path and "\\" not in image_path:
        filename = image_path
    else:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "Invalid image path format. Use /uploads/filename.jpg",
                "code": "INVALID_PATH_FORMAT",
            },
        )

    # Validate filename format (must be UUID hex + valid extension)
    if not VALID_FILENAME_PATTERN.match(filename):
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "Invalid filename format. Only uploaded files are allowed.",
                "code": "INVALID_FILENAME",
            },
        )

    # Build and resolve path
    full_path = (UPLOAD_DIR / filename).resolve()

    # Security check: ensure path is within UPLOAD_DIR
    try:
        full_path.relative_to(UPLOAD_DIR.resolve())
    except ValueError:
        logger.warning(f"Path traversal attempt detected: {image_path}")
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "Invalid path. Access denied.",
                "code": "PATH_TRAVERSAL_BLOCKED",
            },
        )

    return full_path


def verify_image_file(file_path: Path) -> None:
    """Verify that the file is a valid image.

    Args:
        file_path: Path to the image file.

    Raises:
        HTTPException: If file is not a valid image.
    """
    # Check file exists
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail={
                "success": False,
                "error": f"Image file not found.",
                "code": "IMAGE_NOT_FOUND",
            },
        )

    # Check file extension
    suffix = file_path.suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(
            status_code=400,
            detail={
                "success": False,
                "error": "Invalid image format. Only JPG and PNG are supported.",
                "code": "INVALID_FORMAT",
            },
        )

    # Verify magic bytes (same as upload.py)
    magic_bytes = {
        b"\xff\xd8\xff": "image/jpeg",
        b"\x89PNG\r\n\x1a\n": "image/png",
    }

    try:
        with open(file_path, "rb") as f:
            header = f.read(16)

        is_valid = any(header.startswith(magic) for magic in magic_bytes)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid or corrupted image file.",
                    "code": "INVALID_IMAGE_CONTENT",
                },
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading image file: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Failed to read image file.",
                "code": "FILE_READ_ERROR",
            },
        )


@router.post("/process", response_model=OcrProcessResponse)
async def process_ocr(request: OcrProcessRequest) -> OcrProcessResponse:
    """Process OCR on an uploaded image.

    Args:
        request: OCR process request with image path.

    Returns:
        OcrProcessResponse with recognized text and confidence levels.

    Raises:
        HTTPException: If image not found or OCR processing fails.
    """
    # Validate and resolve path securely (prevents path traversal)
    full_path = validate_and_resolve_path(request.image_path)

    # Verify image file is valid
    verify_image_file(full_path)

    try:
        # Run OCR with timeout (NFR-001: 10초 이내)
        logger.info(f"Starting OCR processing for: {full_path.name}")

        # Use asyncio.to_thread (Python 3.9+) instead of deprecated get_event_loop()
        result = await asyncio.wait_for(
            asyncio.to_thread(run_ocr, full_path),
            timeout=OCR_TIMEOUT_SECONDS,
        )

        if not result.success:
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": result.error or "OCR processing failed",
                    "code": "OCR_FAILED",
                },
            )

        # Convert result to response
        response_data = result.to_dict()

        return OcrProcessResponse(
            success=response_data["success"],
            results=[
                OcrResultItem(
                    text=item["text"],
                    confidence=item["confidence"],
                    confidence_level=item["confidence_level"],
                    warning=item["warning"],
                    bbox=item["bbox"],
                )
                for item in response_data["results"]
            ],
            full_text=response_data["full_text"],
            processing_time_ms=response_data["processing_time_ms"],
            error=response_data["error"],
        )

    except asyncio.TimeoutError:
        logger.error(f"OCR processing timeout for: {full_path.name}")
        raise HTTPException(
            status_code=408,
            detail={
                "success": False,
                "error": f"OCR processing timeout. Maximum allowed time is {OCR_TIMEOUT_SECONDS} seconds.",
                "code": "OCR_TIMEOUT",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Unexpected error during OCR processing: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "An unexpected error occurred during OCR processing.",
                "code": "INTERNAL_ERROR",
            },
        ) from e
