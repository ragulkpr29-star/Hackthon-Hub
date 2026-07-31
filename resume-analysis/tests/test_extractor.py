"""
Unit tests for the sentence-aware chunking helper in ``app/extractor.py``.

These exercise only ``EntityExtractor._chunk_text``, which is pure spaCy
(a rule-based sentencizer with no model download) and needs no GLiNER
model weights, keeping this test module fully offline.
"""
from __future__ import annotations

from app.extractor import EntityExtractor


def test_short_text_is_a_single_chunk() -> None:
    chunks = EntityExtractor._chunk_text("Short resume text.", max_chars=3000)
    assert chunks == ["Short resume text."]


def test_long_text_is_split_into_multiple_chunks() -> None:
    sentence = "Experienced Python developer skilled in FastAPI and Docker. "
    long_text = sentence * 200  # comfortably over any reasonable max_chars
    chunks = EntityExtractor._chunk_text(long_text, max_chars=500)

    assert len(chunks) > 1
    assert all(len(chunk) <= 550 for chunk in chunks)  # small slack for join spacing


def test_empty_text_returns_no_chunks() -> None:
    assert EntityExtractor._chunk_text("", max_chars=3000) == []
