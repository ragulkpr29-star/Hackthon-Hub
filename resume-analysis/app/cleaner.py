"""
Text cleaning utilities that normalize raw, PDF-extracted text before it
is handed to the NLP pipeline (``extractor.py``).
"""
from __future__ import annotations

import re

from app.utils import get_logger

logger = get_logger(__name__)

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_BULLET_CHARS = re.compile(r"[•●▪◦‣∙·]")
_MULTI_SPACE_OR_TAB = re.compile(r"[ \t]+")
_MULTI_NEWLINE = re.compile(r"\n{3,}")


class TextCleaner:
    """Normalizes raw extracted resume text for downstream NLP processing."""

    def clean(self, text: str) -> str:
        """Return a cleaned, whitespace-normalized version of ``text``."""
        if not text:
            return ""

        cleaned = _CONTROL_CHARS.sub("", text)
        cleaned = _BULLET_CHARS.sub("-", cleaned)
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")
        cleaned = _MULTI_SPACE_OR_TAB.sub(" ", cleaned)
        cleaned = _MULTI_NEWLINE.sub("\n\n", cleaned)
        cleaned = "\n".join(line.strip() for line in cleaned.split("\n"))

        return cleaned.strip()
