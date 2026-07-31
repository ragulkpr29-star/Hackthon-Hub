"""
API-level tests for ``POST /analyze-resume``.

The heavy ML components (``EntityExtractor``, ``SkillMatcher``) are
replaced with lightweight fakes so these tests run fully offline and
near-instantly, while still exercising the real PDF parsing, cleaning,
and orchestration logic end-to-end. This is possible precisely because
``app/dependencies.py`` retrieves collaborators from ``app.state`` rather
than constructing them inline -- the dependency-injection design pays for
itself here.
"""
from __future__ import annotations

import fitz
import pytest
from fastapi.testclient import TestClient

from app.cleaner import TextCleaner
from app.main import app
from app.parser import PDFParser


class FakeEntityExtractor:
    """Stand-in for ``EntityExtractor`` that returns fixed, known entities."""

    is_loaded = True

    def extract(self, text: str) -> dict:
        return {
            "programming_languages": ["Py", "JavaScript"],
            "job_titles": ["Software Engineer"],
            "companies": ["Acme Corp"],
        }


class FakeSkillMatcher:
    """Stand-in for ``SkillMatcher`` that maps one known alias and dedupes."""

    is_loaded = True

    def normalize_category(self, category: str, raw_terms: list) -> list:
        seen: list = []
        for term in raw_terms:
            normalized = "Python" if term == "Py" else term
            if normalized not in seen:
                seen.append(normalized)
        return seen


def _make_sample_pdf_bytes(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    pdf_bytes = document.tobytes()
    document.close()
    return pdf_bytes


@pytest.fixture
def client():
    # Populate app.state with the real (lightweight) components plus fakes
    # for the heavy ML models, bypassing the `lifespan` startup hook so
    # tests never attempt a real model download.
    app.state.pdf_parser = PDFParser()
    app.state.text_cleaner = TextCleaner()
    app.state.entity_extractor = FakeEntityExtractor()
    app.state.skill_matcher = FakeSkillMatcher()
    return TestClient(app)


def test_analyze_resume_success(client: TestClient) -> None:
    pdf_bytes = _make_sample_pdf_bytes(
        "Jane Doe - Software Engineer at Acme Corp. Skills: Py, JavaScript."
    )
    response = client.post(
        "/analyze-resume",
        files={"resume": ("resume.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "Python" in body["analysis"]["programming_languages"]
    assert body["analysis"]["job_titles"] == ["Software Engineer"]
    assert body["analysis"]["experience"][0]["company"] == "Acme Corp"


def test_rejects_non_pdf_file(client: TestClient) -> None:
    response = client.post(
        "/analyze-resume",
        files={"resume": ("resume.txt", b"not a pdf", "text/plain")},
    )
    assert response.status_code == 415
    assert response.json()["success"] is False


def test_rejects_empty_file(client: TestClient) -> None:
    response = client.post(
        "/analyze-resume",
        files={"resume": ("resume.pdf", b"", "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["success"] is False


def test_scanned_pdf_returns_ocr_message(client: TestClient) -> None:
    document = fitz.open()
    document.new_page()  # blank page: no extractable text at all
    pdf_bytes = document.tobytes()
    document.close()

    response = client.post(
        "/analyze-resume",
        files={"resume": ("resume.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is False
    assert "OCR required" in body["message"]


def test_health_check(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["models_loaded"] is True
