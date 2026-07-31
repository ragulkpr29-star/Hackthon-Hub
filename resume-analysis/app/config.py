"""
Configuration settings for the Resume Analysis microservice.

Centralizes every environment-driven and static configuration value used
throughout the application so no other module hardcodes model names,
thresholds, or file-size limits.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"


class Settings(BaseSettings):
    """Application-wide configuration, overridable via environment variables
    prefixed with ``RESUME_ANALYSIS_`` (e.g. ``RESUME_ANALYSIS_LOG_LEVEL=DEBUG``)."""

    app_name: str = "Resume Analysis Service"
    app_version: str = "1.0.0"

    # --- Upload constraints -------------------------------------------------
    allowed_content_types: List[str] = ["application/pdf"]
    allowed_extension: str = ".pdf"
    max_file_size_mb: int = 10

    # --- Pretrained models (inference only -- nothing is trained here) -----
    sentence_transformer_model: str = "all-MiniLM-L6-v2"
    gliner_model: str = "urchade/gliner_medium-v2.1"
    gliner_score_threshold: float = 0.4
    semantic_similarity_threshold: float = 0.62

    # GLiNER is a zero-shot NER model: we simply tell it, at inference time,
    # which entity labels we want it to look for.
    gliner_labels: List[str] = [
        "programming language",
        "framework",
        "library",
        "database",
        "devops tool",
        "cloud platform",
        "AI/ML technology",
        "soft skill",
        "education",
        "degree",
        "university",
        "project",
        "certification",
        "company",
        "job title",
    ]

    # --- Paths ---------------------------------------------------------------
    data_dir: Path = DATA_DIR
    models_dir: Path = MODELS_DIR
    skills_taxonomy_path: Path = DATA_DIR / "skills.json"

    # --- Logging ---------------------------------------------------------------
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_prefix="RESUME_ANALYSIS_", case_sensitive=False)


@lru_cache
def get_settings() -> Settings:
    """Return a process-wide cached ``Settings`` instance (singleton)."""
    return Settings()
