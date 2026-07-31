"""
Semantic skill normalization and merging layer.

A pretrained Sentence-BERT model (``all-MiniLM-L6-v2``, loaded once at
startup) generates embeddings that are compared with scikit-learn's
``cosine_similarity`` against a canonical skills taxonomy
(``data/skills.json``). This is inference-only -- no model is trained.

Two-stage normalization:
  1. Exact alias lookup (fast, deterministic) -- e.g. "Node" -> "Node.js".
  2. Semantic fallback via cosine similarity for spellings/abbreviations
     not present in the taxonomy's alias list.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING, Dict, List, Tuple

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.config import Settings
from app.exceptions import ModelLoadError
from app.utils import dedupe_preserve_order, get_logger

if TYPE_CHECKING:  # pragma: no cover - typing only, avoids a hard runtime dependency
    from sentence_transformers import SentenceTransformer

logger = get_logger(__name__)

# Categories that go through taxonomy-based normalization (technical skills).
# Non-technical categories (education, companies, projects, ...) are only
# deduplicated, since there is no fixed canonical vocabulary for them.
NORMALIZED_CATEGORIES = (
    "programming_languages",
    "frameworks",
    "libraries",
    "databases",
    "cloud",
    "devops",
    "ai_ml",
    "tools",
)


class SkillTaxonomy:
    """Loads and indexes the canonical skills taxonomy from ``data/skills.json``."""

    def __init__(self, taxonomy_path: Path) -> None:
        self._taxonomy_path = taxonomy_path
        # alias (lowercase) -> canonical name
        self.alias_to_canonical: Dict[str, str] = {}
        # category -> list of canonical names
        self.canonical_by_category: Dict[str, List[str]] = {}
        self._load()

    def _load(self) -> None:
        with open(self._taxonomy_path, "r", encoding="utf-8") as handle:
            raw = json.load(handle)

        for category, entries in raw.items():
            canonicals: List[str] = []
            for canonical_name, aliases in entries.items():
                canonicals.append(canonical_name)
                self.alias_to_canonical[canonical_name.lower()] = canonical_name
                for alias in aliases:
                    self.alias_to_canonical[alias.lower()] = canonical_name
            self.canonical_by_category[category] = canonicals

    def lookup_exact(self, term: str) -> str | None:
        """Return the canonical name for an exact alias/name match, if any."""
        return self.alias_to_canonical.get(term.strip().lower())

    def all_canonical_for(self, category: str) -> List[str]:
        return self.canonical_by_category.get(category, [])


class SkillMatcher:
    """Normalizes raw, freeform skill strings extracted by GLiNER into a
    clean canonical vocabulary, merging duplicates and near-duplicates."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._model: "SentenceTransformer | None" = None
        self._taxonomy = SkillTaxonomy(settings.skills_taxonomy_path)
        # category -> (canonical_names, embeddings matrix)
        self._embedding_cache: Dict[str, Tuple[List[str], np.ndarray]] = {}

    def load(self) -> None:
        """Load the pretrained Sentence-BERT model. Call exactly once, at startup."""
        try:
            # Imported lazily so this module (and, crucially, `SkillTaxonomy`)
            # stays importable/testable without the heavy `sentence-transformers`
            # + `torch` stack present. Production always installs it via
            # requirements.txt.
            from sentence_transformers import SentenceTransformer

            logger.info(
                "Loading Sentence-BERT model '%s'...",
                self._settings.sentence_transformer_model,
            )
            self._model = SentenceTransformer(self._settings.sentence_transformer_model)
            self._precompute_taxonomy_embeddings()
            logger.info("Sentence-BERT model loaded successfully.")
        except Exception as exc:
            logger.exception("Failed to load Sentence-BERT model.")
            raise ModelLoadError(
                f"Failed to load semantic similarity model: {exc}"
            ) from exc

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    def _precompute_taxonomy_embeddings(self) -> None:
        assert self._model is not None
        for category, names in self._taxonomy.canonical_by_category.items():
            if not names:
                continue
            embeddings = self._model.encode(names, convert_to_numpy=True)
            self._embedding_cache[category] = (names, embeddings)

    def normalize_category(self, category: str, raw_terms: List[str]) -> List[str]:
        """Normalize a list of raw extracted terms belonging to ``category``
        (e.g. ``"programming_languages"``) against the canonical taxonomy,
        merging duplicates and near-duplicates."""
        if not raw_terms:
            return []

        if category not in NORMALIZED_CATEGORIES:
            return dedupe_preserve_order(raw_terms)

        resolved: List[str] = []
        unresolved: List[str] = []

        for term in raw_terms:
            exact = self._taxonomy.lookup_exact(term)
            if exact:
                resolved.append(exact)
            else:
                unresolved.append(term)

        if unresolved and self._model is not None and category in self._embedding_cache:
            resolved.extend(self._semantic_resolve(category, unresolved))
        else:
            # No model loaded, or no taxonomy entries for this category:
            # keep the raw terms as-is rather than dropping them.
            resolved.extend(unresolved)

        return dedupe_preserve_order(resolved)

    def _semantic_resolve(self, category: str, terms: List[str]) -> List[str]:
        """Map each unresolved term to its closest canonical name if cosine
        similarity clears the configured threshold; otherwise keep the
        original term as a new, previously-unseen skill."""
        assert self._model is not None
        names, embeddings = self._embedding_cache[category]
        term_embeddings = self._model.encode(terms, convert_to_numpy=True)

        similarity_matrix = cosine_similarity(term_embeddings, embeddings)

        results: List[str] = []
        for idx, term in enumerate(terms):
            best_idx = int(np.argmax(similarity_matrix[idx]))
            best_score = float(similarity_matrix[idx][best_idx])
            if best_score >= self._settings.semantic_similarity_threshold:
                results.append(names[best_idx])
            else:
                results.append(term.strip())
        return results
