"""
PDF parsing layer built on PyMuPDF (``fitz``).

Responsible ONLY for turning raw PDF bytes into raw extracted text, and
for surfacing precise, typed errors for every failure mode the service
needs to handle (encrypted, corrupted, empty, no-text, etc). No cleaning
or NLP happens here -- see ``cleaner.py`` and ``extractor.py``.
"""
from __future__ import annotations

import fitz  # PyMuPDF

from app.exceptions import CorruptedPDFError, EmptyFileError, EncryptedPDFError, NoTextFoundError
from app.utils import get_logger

logger = get_logger(__name__)


class PDFParser:
    """Extracts raw text from PDF byte streams."""

    def extract_text(self, file_bytes: bytes) -> str:
        """Extract raw text from a PDF's bytes.

        Raises:
            EmptyFileError: the file has zero bytes.
            CorruptedPDFError: PyMuPDF cannot parse the PDF's structure.
            EncryptedPDFError: the PDF is password-protected.
            NoTextFoundError: the PDF opens fine but yields no extractable
                text (e.g. a scanned / image-based document).
        """
        if not file_bytes:
            raise EmptyFileError("Uploaded file is empty.")

        try:
            document = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as exc:  # PyMuPDF raises assorted low-level errors
            logger.warning("Failed to open PDF: %s", exc)
            raise CorruptedPDFError(
                "The uploaded file could not be parsed as a valid PDF."
            ) from exc

        try:
            if document.is_encrypted:
                # Some exported/encrypted PDFs can still be opened with an
                # empty password -- try that before giving up.
                if not document.authenticate(""):
                    raise EncryptedPDFError(
                        "The PDF is password-protected and cannot be read."
                    )

            if document.page_count == 0:
                raise NoTextFoundError(
                    "Scanned or image-based PDF detected. OCR required."
                )

            text_chunks: list[str] = [page.get_text("text") for page in document]
            raw_text = "\n".join(text_chunks).strip()

            if not raw_text:
                raise NoTextFoundError(
                    "Scanned or image-based PDF detected. OCR required."
                )

            return raw_text
        finally:
            document.close()
