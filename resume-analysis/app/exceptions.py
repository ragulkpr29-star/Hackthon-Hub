"""
Custom exception hierarchy for the Resume Analysis service.

Each exception maps to one specific, user-facing failure mode. Keeping
these as distinct types (rather than generic ``ValueError``/``Exception``)
lets ``app.main`` translate every failure into an accurate HTTP status
code and a clear message, instead of a bare 500.
"""
from __future__ import annotations


class ResumeAnalysisError(Exception):
    """Base class for all handled errors raised by this service."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class InvalidFileTypeError(ResumeAnalysisError):
    """Raised when the uploaded file is not a PDF."""


class EmptyFileError(ResumeAnalysisError):
    """Raised when the uploaded file has zero bytes."""


class FileTooLargeError(ResumeAnalysisError):
    """Raised when the uploaded file exceeds the configured size limit."""


class EncryptedPDFError(ResumeAnalysisError):
    """Raised when the PDF is password-protected and cannot be opened."""


class CorruptedPDFError(ResumeAnalysisError):
    """Raised when PyMuPDF cannot open or parse the PDF's structure."""


class NoTextFoundError(ResumeAnalysisError):
    """Raised when a PDF opens successfully but yields no extractable text
    (typically a scanned / image-based document that would need OCR)."""


class ModelLoadError(ResumeAnalysisError):
    """Raised when one of the ML models fails to load at startup."""
