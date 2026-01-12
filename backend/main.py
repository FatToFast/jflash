"""J-Flash Backend - Japanese Learning App API Server.

Configuration:
- DEPLOY_MODE: "full" (default, with OCR) or "lite" (review-only, no OCR)
- CORS_ORIGINS: Comma-separated list of allowed origins (default: localhost:3000)
- SKIP_PRELOAD: Set to "true" to skip OCR/Fugashi preloading (faster dev startup)
- DATA_DIR: Override database directory path
- UPLOADS_DIR: Override uploads directory path

Example:
    # Full mode (local development with OCR)
    CORS_ORIGINS="http://localhost:3000" uvicorn main:app --reload

    # Lite mode (web deployment, review-only)
    DEPLOY_MODE=lite uvicorn main:app

    # Fast dev startup (skip model preloading)
    SKIP_PRELOAD=true uvicorn main:app --reload
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api import morphology, ocr, upload, vocab

# =============================================================================
# Configuration Constants
# =============================================================================

# App version - single source of truth
APP_VERSION = "1.2.0"
APP_NAME = "J-Flash API"
APP_DESCRIPTION = "Japanese Learning App - OCR-powered vocabulary extraction with SRS"

# Directory paths (can be overridden via environment variables)
_BASE_DIR = Path(__file__).parent
DATA_DIR = Path(os.getenv("DATA_DIR", str(_BASE_DIR.parent / "data")))
DB_PATH = DATA_DIR / "japanese_learning.db"
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", str(_BASE_DIR / "uploads")))

# CORS configuration
# Default: localhost for development
# Override with CORS_ORIGINS env var for production/staging
DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

def _get_cors_origins() -> list[str]:
    """Get CORS origins from environment or use defaults."""
    env_origins = os.getenv("CORS_ORIGINS")
    if env_origins:
        return [origin.strip() for origin in env_origins.split(",") if origin.strip()]
    return DEFAULT_CORS_ORIGINS

# Deploy mode configuration
# "full" = all features including OCR (default, for local development)
# "lite" = review-only, no OCR (for web deployment, smaller image)
DEPLOY_MODE = os.getenv("DEPLOY_MODE", "full").lower()
IS_LITE_MODE = DEPLOY_MODE == "lite"

# Preload configuration
# Set SKIP_PRELOAD=true for faster development startup
SKIP_PRELOAD = os.getenv("SKIP_PRELOAD", "").lower() == "true"


# =============================================================================
# Application Lifespan
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler.

    Handles:
    - Directory initialization with error handling
    - Optional model preloading (skip with SKIP_PRELOAD=true or DEPLOY_MODE=lite)
    """
    # Startup
    mode_str = "LITE (review-only)" if IS_LITE_MODE else "FULL (with OCR)"
    print(f"Starting {APP_NAME} v{APP_VERSION} [{mode_str}]...")
    print(f"Database: {DB_PATH}")

    # Initialize uploads directory with error handling (only in full mode)
    if not IS_LITE_MODE:
        try:
            UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
            print(f"Uploads directory: {UPLOADS_DIR}")
        except PermissionError as e:
            print(f"ERROR: Cannot create uploads directory: {e}")
            print("Please check filesystem permissions or set UPLOADS_DIR to a writable path.")
            raise
        except Exception as e:
            print(f"ERROR: Failed to initialize uploads directory: {e}")
            raise

    # Model preloading (only in full mode, can be skipped for faster dev startup)
    if IS_LITE_MODE:
        print("Lite mode: Skipping OCR/NLP model loading")
    elif SKIP_PRELOAD:
        print("Skipping model preload (SKIP_PRELOAD=true)")
    else:
        # Preload OCR model to avoid cold-start timeout (NFR-001: 10초 이내 처리)
        # First OCR request without preloading can exceed timeout due to model loading
        print("Preloading EasyOCR model (this may take a moment on first run)...")
        try:
            from services.ocr_service import get_reader
            get_reader()  # Triggers model download/load
            print("EasyOCR model loaded successfully.")
        except Exception as e:
            print(f"Warning: Failed to preload EasyOCR model: {e}")
            print("OCR will attempt to load on first request.")

        # Preload Fugashi tagger (MeCab dictionary)
        # Note: Uses morphology_service (not nlp_service as per ARCHITECTURE.md naming)
        print("Preloading Fugashi tagger (MeCab dictionary)...")
        try:
            from services.morphology_service import get_tagger
            get_tagger()  # Triggers dictionary load
            print("Fugashi tagger loaded successfully.")
        except Exception as e:
            print(f"Warning: Failed to preload Fugashi tagger: {e}")
            print("Morphology analysis will attempt to load on first request.")

    yield
    # Shutdown
    print(f"Shutting down {APP_NAME}...")


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title=APP_NAME,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    lifespan=lifespan,
)

# CORS configuration
# Production/staging origins can be set via CORS_ORIGINS environment variable
cors_origins = _get_cors_origins()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Health and Info Endpoints
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "j-flash-api",
        "version": APP_VERSION,
    }


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "docs": "/docs",
        "health": "/health",
    }


# =============================================================================
# API Routers
# =============================================================================

# Core APIs - conditionally loaded based on deploy mode
if not IS_LITE_MODE:
    # Full mode: Include OCR, upload, morphology APIs
    app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
    app.include_router(ocr.router, prefix="/api/ocr", tags=["ocr"])
    app.include_router(morphology.router, prefix="/api/morphology", tags=["morphology"])
    # Static file serving for uploaded images
    app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Vocabulary API (read-only in lite mode, full access in full mode)
app.include_router(vocab.router, prefix="/api/vocab", tags=["vocabulary"])

# Epic 4: Review System
from api import review
app.include_router(review.router, prefix="/api/review", tags=["review"])

# Epic 5: Grammar Management
from api import grammar
app.include_router(grammar.router, prefix="/api/grammar", tags=["grammar"])

# Epic 6: Kanji Learning
from api import kanji
app.include_router(kanji.router, prefix="/api/kanji", tags=["kanji"])

# Epic 7: Statistics Dashboard
from api import stats
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])

# Epic 8: Export/Import
from api import export_import
app.include_router(export_import.router, prefix="/api/data", tags=["export-import"])
