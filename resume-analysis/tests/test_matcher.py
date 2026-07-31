"""
Unit tests for exact-alias skill normalization (``app/matcher.py``).

These exercise ``SkillTaxonomy`` directly, which needs only the
``data/skills.json`` file -- not the Sentence-BERT model -- keeping this
test module fully offline and fast. They also directly validate the
normalization examples called out in the project spec (Node -> Node.js,
JS -> JavaScript, Py -> Python, ReactJS -> React, Spring -> Spring Boot).
Semantic (embedding-based) fallback matching is an integration-level
concern that requires the real model and is exercised manually per the
README, not in this offline suite.
"""
from __future__ import annotations

from app.config import get_settings
from app.matcher import SkillTaxonomy


def test_exact_alias_resolves_to_canonical_name() -> None:
    settings = get_settings()
    taxonomy = SkillTaxonomy(settings.skills_taxonomy_path)

    assert taxonomy.lookup_exact("node") == "Node.js"
    assert taxonomy.lookup_exact("JS") == "JavaScript"
    assert taxonomy.lookup_exact("py") == "Python"
    assert taxonomy.lookup_exact("reactjs") == "React"
    assert taxonomy.lookup_exact("spring") == "Spring Boot"


def test_lookup_is_case_insensitive() -> None:
    settings = get_settings()
    taxonomy = SkillTaxonomy(settings.skills_taxonomy_path)

    assert taxonomy.lookup_exact("PYTHON") == "Python"
    assert taxonomy.lookup_exact("Docker") == "Docker"


def test_unknown_term_returns_none() -> None:
    settings = get_settings()
    taxonomy = SkillTaxonomy(settings.skills_taxonomy_path)

    assert taxonomy.lookup_exact("some-made-up-tech-xyz") is None


def test_all_canonical_for_returns_category_members() -> None:
    settings = get_settings()
    taxonomy = SkillTaxonomy(settings.skills_taxonomy_path)

    programming_languages = taxonomy.all_canonical_for("programming_languages")
    assert "Python" in programming_languages
    assert "JavaScript" in programming_languages
