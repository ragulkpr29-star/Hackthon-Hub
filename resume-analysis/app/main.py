"""
FastAPI application entrypoint for the Resume Analysis microservice.

Wires together configuration, ML model loading (exactly once, at
startup), dependency injection, the single public endpoint, and
centralized exception handling.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Request, UploadFile
from fastapi.responses import JSONResponse

from app.cleaner import TextCleaner
from app.config import get_settings
from app.dependencies import (
    get_entity_extractor,
    get_pdf_parser,
    get_skill_matcher,
    get_text_cleaner,
)
from app.exceptions import (
    EmptyFileError,
    FileTooLargeError,
    InvalidFileTypeError,
    ModelLoadError,
    NoTextFoundError,
    ResumeAnalysisError,
)
from app.extractor import EntityExtractor
from app.matcher import SkillMatcher
from app.parser import PDFParser
from app.schemas import ErrorResponse, ResumeAnalysisResponse
from app.service import ResumeAnalyzer
from app.utils import configure_logging, get_logger

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load every ML model exactly once, at process startup.

    If a model fails to load, ``ModelLoadError`` propagates out of this
    function, which aborts FastAPI/uvicorn startup with a clear log
    message -- a deliberate fail-fast: the service should never accept
    traffic while a required model is unavailable.
    """
    logger.info("Starting up %s v%s", settings.app_name, settings.app_version)

    app.state.pdf_parser = PDFParser()
    app.state.text_cleaner = TextCleaner()

    entity_extractor = EntityExtractor(settings)
    entity_extractor.load()
    app.state.entity_extractor = entity_extractor

    skill_matcher = SkillMatcher(settings)
    skill_matcher.load()
    app.state.skill_matcher = skill_matcher

    logger.info("Startup complete. All models loaded and ready.")
    yield
    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Standalone microservice that extracts structured, "
    "normalized data from PDF resumes using pretrained open-source NLP models.",
    lifespan=lifespan,
)


def _validate_upload(file: UploadFile, contents: bytes) -> None:
    """Validate file type and size before any parsing is attempted."""
    filename = (file.filename or "").lower()
    is_pdf_content_type = file.content_type in settings.allowed_content_types
    is_pdf_extension = filename.endswith(settings.allowed_extension)

    if not (is_pdf_content_type or is_pdf_extension):
        raise InvalidFileTypeError("Only PDF files are accepted.")

    if not contents:
        raise EmptyFileError("Uploaded file is empty.")

    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise FileTooLargeError(
            f"Uploaded file exceeds the maximum allowed size of "
            f"{settings.max_file_size_mb} MB."
        )


@app.post(
    "/analyze-resume",
    response_model=ResumeAnalysisResponse,
    responses={
        400: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        415: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    summary="Analyze a PDF resume and return structured, normalized data.",
)
async def analyze_resume(
    resume: UploadFile = File(..., description="The PDF resume to analyze."),
    pdf_parser: PDFParser = Depends(get_pdf_parser),
    text_cleaner: TextCleaner = Depends(get_text_cleaner),
    entity_extractor: EntityExtractor = Depends(get_entity_extractor),
    skill_matcher: SkillMatcher = Depends(get_skill_matcher),
):
    """Accept a PDF resume and return structured, normalized analysis."""
    contents = await resume.read()
    _validate_upload(resume, contents)

    analyzer = ResumeAnalyzer(pdf_parser, text_cleaner, entity_extractor, skill_matcher)

    try:
        return analyzer.analyze(contents)
    except NoTextFoundError:
        # Exact contract required for scanned / image-based PDFs: a normal
        # 200 response with success=false, not an HTTP error.
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "message": "Scanned or image-based PDF detected. OCR required.",
            },
        )


@app.exception_handler(ResumeAnalysisError)
async def resume_analysis_error_handler(request: Request, exc: ResumeAnalysisError) -> JSONResponse:
    """Translate domain exceptions into consistent JSON error responses
    with an appropriate HTTP status code per failure type."""
    status_code = 400
    if isinstance(exc, ModelLoadError):
        status_code = 503
    elif isinstance(exc, FileTooLargeError):
        status_code = 413
    elif isinstance(exc, InvalidFileTypeError):
        status_code = 415

    logger.warning("%s: %s", type(exc).__name__, exc.message)
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": exc.message},
    )


@app.get("/health", summary="Liveness/readiness probe.")
async def health_check(request: Request) -> dict:
    """Report whether all ML models have finished loading."""
    extractor: EntityExtractor = request.app.state.entity_extractor
    matcher: SkillMatcher = request.app.state.skill_matcher
    return {
        "status": "ok",
        "models_loaded": bool(extractor.is_loaded and matcher.is_loaded),
    }
