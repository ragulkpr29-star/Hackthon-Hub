"""Unit tests for ``TextCleaner`` (app/cleaner.py)."""
from __future__ import annotations

from app.cleaner import TextCleaner


def test_collapses_whitespace() -> None:
    cleaner = TextCleaner()
    result = cleaner.clean("Python    Developer\t\twith   5   years")
    assert result == "Python Developer with 5 years"


def test_collapses_excess_blank_lines() -> None:
    cleaner = TextCleaner()
    result = cleaner.clean("Line one\n\n\n\n\nLine two")
    assert result == "Line one\n\nLine two"


def test_normalizes_bullet_characters() -> None:
    cleaner = TextCleaner()
    result = cleaner.clean("\u2022 Built APIs\n\u25cf Led team")
    assert "- Built APIs" in result
    assert "- Led team" in result


def test_strips_control_characters() -> None:
    cleaner = TextCleaner()
    result = cleaner.clean("Resume\x0bText\x0cHere")
    assert result == "ResumeTextHere"


def test_handles_empty_input() -> None:
    cleaner = TextCleaner()
    assert cleaner.clean("") == ""
