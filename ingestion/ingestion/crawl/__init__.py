"""Crawler — discovers SC e-Library decisions, downloads PDFs.

Public entry points:
  discover_month(year, month_abbr) -> list[doc_id]
  fetch_decision(doc_id) -> DecisionMetadata + PDF saved to cache
"""

from ingestion.crawl.sc_elibrary import (
    DecisionMetadata,
    discover_month,
    fetch_decision,
)

__all__ = ["DecisionMetadata", "discover_month", "fetch_decision"]
