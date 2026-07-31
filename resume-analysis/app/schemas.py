"""
Pydantic schemas defining the request/response contracts for the API.
"""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ExperienceEntry(BaseModel):
    """A single work-experience entry inferred from the resume text by
    pairing an extracted job title with its most likely nearby company."""

    job_title: Optional[str] = None
    company: Optional[str] = None


class AnalysisResult(BaseModel):
    """Structured, normalized analysis extracted from a resume."""

    programming_languages: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    libraries: List[str] = Field(default_factory=list)
    databases: List[str] = Field(default_factory=list)
    cloud: List[str] = Field(default_factory=list)
    devops: List[str] = Field(default_factory=list)
    ai_ml: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    education: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)
    experience: List[ExperienceEntry] = Field(default_factory=list)
    companies: List[str] = Field(default_factory=list)
    job_titles: List[str] = Field(default_factory=list)


class ResumeAnalysisResponse(BaseModel):
    """Successful response envelope for ``POST /analyze-resume``."""

    success: bool = True
    raw_text: str
    analysis: AnalysisResult


class ErrorResponse(BaseModel):
    """Error response envelope used across the API for handled failures."""

    success: bool = False
    message: str
