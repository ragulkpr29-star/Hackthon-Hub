"""
Small, reusable utility helpers shared across the application.
"""
from __future__ import annotations

import logging
import sys
from typing import List, Set


def configure_logging(log_level: str = "INFO") -> None:
    """Configure root logging once, with a consistent formatter.

    Safe to call multiple times (e.g. under the ``--reload`` watcher) --
    it will not attach duplicate handlers.
    """
    root_logger = logging.getLogger()
    if root_logger.handlers:
        root_logger.setLevel(log_level.upper())
        return

    handler = logging.StreamHandler(stream=sys.stdout)
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level.upper())


def get_logger(name: str) -> logging.Logger:
    """Return a module-level logger."""
    return logging.getLogger(name)


def dedupe_preserve_order(items: List[str]) -> List[str]:
    """Remove duplicates (case-insensitive) from a list of strings while
    preserving the order in which each distinct value first appeared."""
    seen: Set[str] = set()
    result: List[str] = []
    for item in items:
        stripped = item.strip()
        key = stripped.lower()
        if key and key not in seen:
            seen.add(key)
            result.append(stripped)
    return result
