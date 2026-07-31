"""
Orchestrates the full resume-analysis pipeline: parsing -> cleaning ->
entity extraction -> semantic normalization -> response assembly.

This is the single place where those independently-testable pieces are
composed together, following the single-responsibility principle: every
collaborator is injected, so this class has zero knowledge of PDF
internals, ML model details, or HTTP concerns.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional

from app.cleaner import TextCleaner
from app.extractor import EntityExtractor
from app.matcher import SkillMatcher
from app.parser import PDFParser
from app.schemas import AnalysisResult, ExperienceEntry, ResumeAnalysisResponse
from app.utils import get_logger

logger = get_logger(__name__)

# Every category key the pipeline populates via GLiNER + normalization.
ALL_CATEGORY_KEYS = (
    "programming_languages",
    "frameworks",
    "libraries",
    "databases",
    "cloud",
    "devops",
    "ai_ml",
    "tools",
    "soft_skills",
    "education",
    "certifications",
    "projects",
    "companies",
    "job_titles",
)


class ResumeAnalyzer:
    """High-level service composing parsing, NLP extraction, and normalization."""

    def __init__(
        self,
        pdf_parser: PDFParser,
        text_cleaner: TextCleaner,
        entity_extractor: EntityExtractor,
        skill_matcher: SkillMatcher,
    ) -> None:
        self._parser = pdf_parser
        self._cleaner = text_cleaner
        self._extractor = entity_extractor
        self._matcher = skill_matcher

    def analyze(self, file_bytes: bytes) -> ResumeAnalysisResponse:
        """Run the full pipeline over a PDF's raw bytes and return the response.

        Any parsing failure (empty file, corrupted PDF, encrypted PDF, no
        extractable text) propagates as the corresponding typed exception
        from ``app.exceptions``, to be handled by the API layer.
        """
        raw_text = self._parser.extract_text(file_bytes)
        cleaned_text = self._cleaner.clean(raw_text)

        grouped_entities: Dict[str, List[str]] = self._extractor.extract(cleaned_text)

        normalized: Dict[str, List[str]] = {
            key: self._matcher.normalize_category(key, grouped_entities.get(key, []))
            for key in ALL_CATEGORY_KEYS
        }

        experience = self._build_experience(
            normalized.get("job_titles", []),
            normalized.get("companies", []),
            cleaned_text,
        )

        analysis = AnalysisResult(
            programming_languages=normalized["programming_languages"],
            frameworks=normalized["frameworks"],
            libraries=normalized["libraries"],
            databases=normalized["databases"],
            cloud=normalized["cloud"],
            devops=normalized["devops"],
            ai_ml=normalized["ai_ml"],
            tools=normalized["tools"],
            soft_skills=normalized["soft_skills"],
            education=normalized["education"],
            certifications=normalized["certifications"],
            projects=normalized["projects"],
            experience=experience,
            companies=normalized["companies"],
            job_titles=normalized["job_titles"],
        )

        return ResumeAnalysisResponse(success=True, raw_text=raw_text, analysis=analysis)

    @staticmethod
    def _build_experience(
        job_titles: List[str], companies: List[str], text: str
    ) -> List[ExperienceEntry]:
        """Best-effort pairing of job titles with companies based on the
        proximity of their first mention in the resume text.

        GLiNER extracts job titles and companies as separate entity types
        with no inherent link between them, so this heuristic reconstructs
        the most likely (title, company) pairs by nearest character-offset
        occurrence -- a reasonable approximation without adding a second
        relation-extraction model.
        """
        if not job_titles:
            return []

        def first_index(term: str) -> int:
            match = re.search(re.escape(term), text, flags=re.IGNORECASE)
            return match.start() if match else -1

        title_positions = [(title, first_index(title)) for title in job_titles]
        company_positions = [(company, first_index(company)) for company in companies]

        entries: List[ExperienceEntry] = []
        used_companies: set[str] = set()

        for title, title_pos in title_positions:
            best_company: Optional[str] = None
            best_distance: Optional[int] = None

            for company, company_pos in company_positions:
                if company in used_companies or title_pos < 0 or company_pos < 0:
                    continue
                distance = abs(company_pos - title_pos)
                if best_distance is None or distance < best_distance:
                    best_distance = distance
                    best_company = company

            if best_company:
                used_companies.add(best_company)

            entries.append(ExperienceEntry(job_title=title, company=best_company))

        return entries
