"""Unit tests for ``PDFParser`` (app/parser.py)."""
from __future__ import annotations

import fitz
import pytest

from app.exceptions import CorruptedPDFError, EmptyFileError, NoTextFoundError
from app.parser import PDFParser


@pytest.fixture
def parser() -> PDFParser:
    return PDFParser()


def _pdf_with_text(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    data = document.tobytes()
    document.close()
    return data


def test_extracts_text_from_valid_pdf(parser: PDFParser) -> None:
    pdf_bytes = _pdf_with_text("Hello resume world")
    text = parser.extract_text(pdf_bytes)
    assert "Hello resume world" in text


def test_raises_on_empty_bytes(parser: PDFParser) -> None:
    with pytest.raises(EmptyFileError):
        parser.extract_text(b"")


def test_raises_on_corrupted_pdf(parser: PDFParser) -> None:
    with pytest.raises(CorruptedPDFError):
        parser.extract_text(b"this is definitely not a valid pdf file")


def test_raises_no_text_found_on_blank_page(parser: PDFParser) -> None:
    document = fitz.open()
    document.new_page()  # a real page, but with no text -> simulates a scan
    pdf_bytes = document.tobytes()
    document.close()

    with pytest.raises(NoTextFoundError):
        parser.extract_text(pdf_bytes)
