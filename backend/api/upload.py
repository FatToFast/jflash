"""Image upload API router.

Story 2.1: Basic image upload functionality.
OCR processing will be added in Story 2.2.
"""

import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Magic bytes for image validation
MAGIC_BYTES = {
    b"\xff\xd8\xff": "image/jpeg",  # JPEG
    b"\x89PNG\r\n\x1a\n": "image/png",  # PNG
}


class ImageUploadResponse(BaseModel):
    """Response schema for image upload."""

    success: bool
    filename: str
    path: str


class ErrorResponse(BaseModel):
    """Error response schema for consistent error format."""

    success: bool = False
    error: str
    code: str


def validate_magic_bytes(data: bytes) -> bool:
    """Validate file by checking magic bytes.

    Args:
        data: File content bytes.

    Returns:
        True if file has valid image magic bytes.
    """
    for magic in MAGIC_BYTES:
        if data.startswith(magic):
            return True
    return False


def cleanup_file(file_path: Path) -> None:
    """Safely remove a file if it exists.

    Args:
        file_path: Path to the file to remove.
    """
    try:
        if file_path.exists():
            file_path.unlink()
            logger.info(f"Cleaned up file: {file_path}")
    except OSError as e:
        logger.warning(f"Failed to cleanup file {file_path}: {e}")


@router.post("/image", response_model=ImageUploadResponse)
async def upload_image(file: UploadFile = File(...)) -> ImageUploadResponse:
    """Upload an image file (JPG/PNG).

    Args:
        file: The image file to upload.

    Returns:
        ImageUploadResponse with success status and file path.

    Raises:
        HTTPException: If file validation fails.
    """
    image_path: Path | None = None

    try:
        # Validate content type (client-provided, can be spoofed)
        content_type = (file.content_type or "").lower()
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Unsupported file type. Only JPG and PNG are allowed.",
                    "code": "INVALID_CONTENT_TYPE",
                },
            )

        # Validate file extension
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid file extension. Only .jpg, .jpeg, and .png are allowed.",
                    "code": "INVALID_EXTENSION",
                },
            )

        # Read file content with size guard (stream first chunk to check)
        data = await file.read()
        await file.close()

        # Validate file is not empty
        if not data:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Empty file uploaded.",
                    "code": "EMPTY_FILE",
                },
            )

        # Validate file size
        if len(data) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail={
                    "success": False,
                    "error": "File too large. Maximum size is 10MB.",
                    "code": "FILE_TOO_LARGE",
                },
            )

        # Validate magic bytes (actual file content)
        if not validate_magic_bytes(data):
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": "Invalid image file. File content does not match JPG or PNG format.",
                    "code": "INVALID_MAGIC_BYTES",
                },
            )

        # Create uploads directory if it doesn't exist
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        # Generate unique filename with UUID
        filename = f"{uuid4().hex}{suffix}"
        image_path = UPLOAD_DIR / filename

        # Save file
        image_path.write_bytes(data)
        logger.info(f"Image uploaded successfully: {filename}")

        return ImageUploadResponse(
            success=True,
            filename=filename,
            path=f"/uploads/{filename}",
        )

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Cleanup file if it was partially written
        if image_path:
            cleanup_file(image_path)

        logger.exception(f"Unexpected error during image upload: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "An unexpected error occurred during upload.",
                "code": "INTERNAL_ERROR",
            },
        ) from e
