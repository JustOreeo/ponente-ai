"""Stub scrapers for PH administrative issuances.

These are scaffolding for Phase 5. Each agency's scraper follows the same
shape as `sc_elibrary.py`:

  discover_*(...) → list[IssuanceMeta]   # surface metadata (id, url, title, date)
  fetch_*(doc_id, cache_dir) → (IssuanceMeta, pdf_path)

Implementations need to be filled in by inspecting each agency's website.
The state DB column `source` differentiates rows from each agency. The
`legal_documents.doc_type` column should be set to 'admin_issuance' for
all of these. Practice areas should default to ['tax'] / ['corporate'] /
['banking'] / ['labor'] respectively.

Order of priority (per the plan):
  BIR  — tax lawyers want this most
  SEC  — corporate
  DOLE — labor
  BSP  — banking / fintech

Done by following the same pattern as sc_elibrary.py:
  - Use the shared rate limiter (CRAWLER_RATE_LIMIT_SECONDS)
  - Identify with our User-Agent
  - Save PDFs into cache/pdf/<doc_id>.pdf so the rest of the pipeline
    (text → meta → chunk → embed → upsert) needs no changes.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

AgencySource = Literal["bir", "sec", "bsp", "dole"]


@dataclass
class IssuanceMeta:
    """Surface-level metadata. Match sc_elibrary's DecisionMetadata shape."""
    doc_id: str
    detail_url: str
    title: str | None = None
    issued_date: str | None = None  # ISO YYYY-MM-DD if parseable, else raw
    issuance_number: str | None = None  # "RR No. 1-2025", "MC No. 7-2026", etc.
    pdf_url: str | None = None


# ---------------------------------------------------------------------------
# BIR — Bureau of Internal Revenue
#   Index: https://www.bir.gov.ph/issuances
#   Issuance types: Revenue Regulations (RR), Revenue Memorandum Circulars
#   (RMC), Revenue Memorandum Orders (RMO), Revenue Audit Memorandum Orders
#   (RAMO), BIR Rulings.
#   Doc IDs: derive from the issuance number, e.g. "RR-2025-001".
# ---------------------------------------------------------------------------


def discover_bir() -> list[IssuanceMeta]:
    """TODO: implement.

    Walk https://www.bir.gov.ph/issuances or whichever per-type listing
    pages exist. For each issuance found:
      - Build doc_id like "BIR-RR-2025-001"
      - Build detail_url to the page that contains the PDF link
      - Extract issuance_number, title, issued_date if available

    Suggested approach:
      1. Hit the listing page; parse table rows.
      2. For each row, follow the detail link.
      3. On the detail page, find the .pdf link and parse the date/number.
    """
    raise NotImplementedError("BIR scraper not yet implemented")


def fetch_bir(doc_id: str, *, cache_dir: Path) -> tuple[IssuanceMeta, Path]:
    """TODO: implement (mirror sc_elibrary.fetch_decision)."""
    raise NotImplementedError("BIR fetch not yet implemented")


# ---------------------------------------------------------------------------
# SEC — Securities and Exchange Commission
#   Index: https://www.sec.gov.ph/mc-and-circulars/
#   Issuance types: Memorandum Circulars (MC), Notices, SEC Opinions.
# ---------------------------------------------------------------------------


def discover_sec() -> list[IssuanceMeta]:
    raise NotImplementedError("SEC scraper not yet implemented")


def fetch_sec(doc_id: str, *, cache_dir: Path) -> tuple[IssuanceMeta, Path]:
    raise NotImplementedError("SEC fetch not yet implemented")


# ---------------------------------------------------------------------------
# BSP — Bangko Sentral ng Pilipinas
#   Index: https://www.bsp.gov.ph/Regulations/Regulations.aspx
#   Issuance types: Circulars, Circular Letters, Memoranda, M-orders.
# ---------------------------------------------------------------------------


def discover_bsp() -> list[IssuanceMeta]:
    raise NotImplementedError("BSP scraper not yet implemented")


def fetch_bsp(doc_id: str, *, cache_dir: Path) -> tuple[IssuanceMeta, Path]:
    raise NotImplementedError("BSP fetch not yet implemented")


# ---------------------------------------------------------------------------
# DOLE — Department of Labor and Employment
#   Index: https://www.dole.gov.ph/issuances/
#   Issuance types: Department Orders (DO), Department Advisories (DA),
#   Labor Advisories.
# ---------------------------------------------------------------------------


def discover_dole() -> list[IssuanceMeta]:
    raise NotImplementedError("DOLE scraper not yet implemented")


def fetch_dole(doc_id: str, *, cache_dir: Path) -> tuple[IssuanceMeta, Path]:
    raise NotImplementedError("DOLE fetch not yet implemented")


# ---------------------------------------------------------------------------
# Dispatch helpers — used by the CLI to invoke the right agency.
# ---------------------------------------------------------------------------

DEFAULT_PRACTICE_AREAS: dict[AgencySource, list[str]] = {
    "bir": ["tax"],
    "sec": ["corporate", "mercantile"],
    "bsp": ["mercantile", "corporate"],
    "dole": ["labor"],
}


def discover(source: AgencySource) -> list[IssuanceMeta]:
    if source == "bir":
        return discover_bir()
    if source == "sec":
        return discover_sec()
    if source == "bsp":
        return discover_bsp()
    if source == "dole":
        return discover_dole()
    raise ValueError(f"unknown source: {source}")


def fetch(source: AgencySource, doc_id: str, *, cache_dir: Path) -> tuple[IssuanceMeta, Path]:
    if source == "bir":
        return fetch_bir(doc_id, cache_dir=cache_dir)
    if source == "sec":
        return fetch_sec(doc_id, cache_dir=cache_dir)
    if source == "bsp":
        return fetch_bsp(doc_id, cache_dir=cache_dir)
    if source == "dole":
        return fetch_dole(doc_id, cache_dir=cache_dir)
    raise ValueError(f"unknown source: {source}")
