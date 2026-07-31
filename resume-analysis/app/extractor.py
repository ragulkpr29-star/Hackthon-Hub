"""
Named-entity extraction layer built on GLiNER (zero-shot NER).

The pretrained GLiNER model (``urchade/gliner_medium-v2.1``) is loaded
exactly once, at application startup via ``load()``, and reused for every
request thereafter. No training or fine-tuning occurs anywhere in this
service -- this is inference-only against an open-source pretrained model.
"""
from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING, Dict, List

import spacy

from app.config import Settings
from app.exceptions import ModelLoadError
from app.utils import get_logger

if TYPE_CHECKING:  # pragma: no cover - typing only, avoids a hard runtime dependency
    from gliner import GLiNER

logger = get_logger(__name__)

# A blank, rule-based spaCy pipeline used purely for sentence-boundary
# detection when chunking long resumes for GLiNER. This requires no model
# download whatsoever -- the sentencizer ships with the `spacy` package
# itself -- which keeps this module importable/testable without any
# network access.
_SENTENCIZER = spacy.blank("en")
_SENTENCIZER.add_pipe("sentencizer")

# Maps the human-readable labels we ask GLiNER to detect (zero-shot) to the
# internal keys used throughout the rest of the pipeline.
LABEL_TO_KEY: Dict[str, str] = {
    "programming language": "programming_languages",
    "framework": "frameworks",
    "library": "libraries",
    "database": "databases",
    "devops tool": "devops",
    "cloud platform": "cloud",
    "ai/ml technology": "ai_ml",
    "soft skill": "soft_skills",
    "education": "education",
    "degree": "education",
    "university": "education",
    "project": "projects",
    "certification": "certifications",
    "company": "companies",
    "job title": "job_titles",
}


class EntityExtractor:
    """Thin, reusable wrapper around a pretrained GLiNER model."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._model: "GLiNER | None" = None

    def load(self) -> None:
        """Load the pretrained GLiNER model. Call exactly once, at startup."""
        try:
            # Imported lazily (rather than at module scope) so this module
            # stays importable -- e.g. for unit tests -- in environments
            # where the `gliner` package and its model weights aren't
            # present. In production, `requirements.txt` always installs it.
            from gliner import GLiNER

            logger.info("Loading GLiNER model '%s'...", self._settings.gliner_model)
            self._model = GLiNER.from_pretrained(self._settings.gliner_model)
            logger.info("GLiNER model loaded successfully.")
        except Exception as exc:
            logger.exception("Failed to load GLiNER model.")
            raise ModelLoadError(
                f"Failed to load entity extraction model: {exc}"
            ) from exc

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def extract(self, text: str) -> Dict[str, List[str]]:
        """Run zero-shot NER over ``text``, grouped by internal category key.

        Returns a dict keyed by the internal keys in ``LABEL_TO_KEY``'s
        values, each mapping to a list of raw (un-normalized) entity strings.
        """
        if self._model is None:
            raise ModelLoadError("Entity extraction model is not loaded.")

        chunks = self._chunk_text(text, max_chars=3000)

        grouped: Dict[str, List[str]] = defaultdict(list)
        for chunk in chunks:
            entities = self._model.predict_entities(
                chunk,
                self._settings.gliner_labels,
                threshold=self._settings.gliner_score_threshold,
            )
            for entity in entities:
                label = entity.get("label", "").strip().lower()
                key = LABEL_TO_KEY.get(label)
                if key:
                    grouped[key].append(entity["text"].strip())

        return dict(grouped)

    @staticmethod
    def _chunk_text(text: str, max_chars: int) -> List[str]:
        """Split ``text`` into sentence-aligned, character-bounded chunks so
        long resumes never silently exceed GLiNER's effective input window."""
        if not text:
            return []
        if len(text) <= max_chars:
            return [text]

        doc = _SENTENCIZER(text)
        sentences = [sent.text.strip() for sent in doc.sents if sent.text.strip()]

        chunks: List[str] = []
        current = ""
        for sentence in sentences:
            if len(current) + len(sentence) + 1 <= max_chars:
                current = f"{current} {sentence}".strip()
            else:
                if current:
                    chunks.append(current)
                current = sentence
        if current:
            chunks.append(current)
        return chunks
