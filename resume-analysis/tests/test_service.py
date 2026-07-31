"""Unit tests for ``ResumeAnalyzer._build_experience`` (app/service.py)."""
from __future__ import annotations

from app.service import ResumeAnalyzer


def test_pairs_job_title_with_nearest_company() -> None:
    text = "Senior Engineer at Acme Corp from 2020 to 2023."
    experience = ResumeAnalyzer._build_experience(
        job_titles=["Senior Engineer"],
        companies=["Acme Corp"],
        text=text,
    )
    assert len(experience) == 1
    assert experience[0].job_title == "Senior Engineer"
    assert experience[0].company == "Acme Corp"


def test_returns_empty_list_when_no_job_titles() -> None:
    experience = ResumeAnalyzer._build_experience([], [], "Some resume text")
    assert experience == []


def test_handles_missing_company_gracefully() -> None:
    experience = ResumeAnalyzer._build_experience(
        job_titles=["Data Scientist"], companies=[], text="Data Scientist role."
    )
    assert len(experience) == 1
    assert experience[0].job_title == "Data Scientist"
    assert experience[0].company is None


def test_assigns_each_company_to_only_one_title() -> None:
    text = "Software Engineer at Acme Corp. Later, Team Lead at Acme Corp."
    experience = ResumeAnalyzer._build_experience(
        job_titles=["Software Engineer", "Team Lead"],
        companies=["Acme Corp"],
        text=text,
    )
    assigned_companies = [entry.company for entry in experience if entry.company]
    assert len(assigned_companies) == 1
