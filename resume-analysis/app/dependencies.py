"""
FastAPI dependency providers.

All models and stateless service objects are constructed exactly once at
application startup (see the ``lifespan`` handler in ``app.main``) and
stored on ``app.state``. These dependency functions simply retrieve them
per-request via FastAPI's ``Depends`` system, so no request ever pays the
cost of reloading a model, and every collaborator here is trivially
mockable in tests via ``app.dependency_overrides``.
"""
from __future__ import annotations

from fastapi import Request

from app.cleaner import TextCleaner
from app.extractor import EntityExtractor
from app.matcher import SkillMatcher
from app.parser import PDFParser


def get_pdf_parser(request: Request) -> PDFParser:
    return request.app.state.pdf_parser


def get_text_cleaner(request: Request) -> TextCleaner:
    return request.app.state.text_cleaner


def get_entity_extractor(request: Request) -> EntityExtractor:
    return request.app.state.entity_extractor


def get_skill_matcher(request: Request) -> SkillMatcher:
    return request.app.state.skill_matcher
