"""Local ordinance scrapers — one plugin per city.

Coverage targets (top 20 PH cities by economic activity / lawyer demand):

  Metro Manila (highest priority):
    Makati, Taguig (BGC), Quezon City, Manila, Pasig, Mandaluyong, Pasay,
    Parañaque, Marikina, Caloocan, Las Piñas, Muntinlupa, Valenzuela,
    Malabon, Navotas, San Juan, Pateros

  Provincial cities (medium priority):
    Cebu City, Davao City, Iloilo City

Each city's website looks different — there's no national registry of
ordinances. We register one plugin per city below; each plugin owns its
discover/fetch logic. The crawl/text/meta/chunk/embed/upsert pipeline is
shared with the SC e-Library and agency scrapers.

doc_id convention: `<CITYCODE>-ORD-<NUMBER>-<YEAR>`
  e.g.  MKT-ORD-2025-001, QC-ORD-SP-2912-2024

Phase 5 ships ONE working plugin (Makati) as the canonical example. The
remaining cities are registered as stubs you can fill in by mirroring the
Makati pattern. Update the `PLUGINS` dict at the bottom of this file as
each city goes live.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import TypeAlias
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from ingestion.crawl._http import get
from ingestion.logging import get_logger

log = get_logger(__name__)


@dataclass
class OrdinanceMeta:
    doc_id: str
    detail_url: str
    title: str | None = None
    ordinance_number: str | None = None
    enacted_date: str | None = None
    pdf_url: str | None = None
    city: str = ""


# Plugin signature: a tuple of (discover_fn, fetch_fn).
CityPlugin: TypeAlias = tuple[
    Callable[[], list[OrdinanceMeta]],
    Callable[[str, Path], tuple[OrdinanceMeta, Path]],
]


# ---------------------------------------------------------------------------
# Makati — the example implementation. Working scaffolding.
#
# Makati City publishes ordinances at https://www.makati.gov.ph/transparency/
# under an "Ordinances" section. PDFs are linked directly with the ordinance
# number in the filename. Use this as the template for other cities.
# ---------------------------------------------------------------------------

MAKATI_LISTING = "https://www.makati.gov.ph/transparency/ordinances"
_MKT_NUM_RE = re.compile(r"\bOrd(?:inance)?\.?\s*No\.?\s*(\d+[\-A-Za-z\d]*)", re.IGNORECASE)


def _discover_makati() -> list[OrdinanceMeta]:
    log.info("crawl Makati ordinances %s", MAKATI_LISTING)
    try:
        res = get(MAKATI_LISTING)
    except Exception as e:
        log.warning("Makati listing failed: %s", e)
        return []

    soup = BeautifulSoup(res.text, "lxml")
    out: list[OrdinanceMeta] = []
    for a in soup.find_all("a", href=True):
        href: str = a["href"]
        if not href.lower().endswith(".pdf"):
            continue
        text = (a.get_text() or "").strip()
        m = _MKT_NUM_RE.search(text) or _MKT_NUM_RE.search(href)
        if not m:
            continue
        number = m.group(1)
        pdf_url = href if href.startswith("http") else urljoin(MAKATI_LISTING, href)
        # Year extraction from filename / text
        year = _extract_year(text) or _extract_year(href) or ""
        doc_id = f"MKT-ORD-{number}{'-' + year if year else ''}"
        out.append(
            OrdinanceMeta(
                doc_id=doc_id,
                detail_url=MAKATI_LISTING,
                title=text or f"Makati Ordinance No. {number}",
                ordinance_number=number,
                enacted_date=_extract_date_from_text(
                    a.find_parent().get_text(" ", strip=True) if a.find_parent() else text
                ),
                pdf_url=pdf_url,
                city="Makati",
            )
        )
    # Dedupe (the listing sometimes repeats links in nav).
    deduped: dict[str, OrdinanceMeta] = {}
    for o in out:
        deduped.setdefault(o.doc_id, o)
    return list(deduped.values())


def _fetch_makati(doc_id: str, cache_dir: Path) -> tuple[OrdinanceMeta, Path]:
    # The discoverer stores pdf_url in state.source_url; the orchestrator can
    # download directly without re-resolving. If state was lost, re-discover.
    raise NotImplementedError(
        f"fetch_makati({doc_id}): pdf_url is captured at discovery time. "
        "Re-run discover or call download_to(pdf_url, cache_dir / f'{doc_id}.pdf')."
    )


# ---------------------------------------------------------------------------
# Stubs — fill in by copy-pasting the Makati pattern and updating the URL +
# regex to match the city's site.
# ---------------------------------------------------------------------------


def _stub_discover(city_label: str, hint: str) -> list[OrdinanceMeta]:
    log.warning(
        "Local-ordinance scraper for %s not yet implemented. %s",
        city_label,
        hint,
    )
    return []


def _stub_fetch(city_label: str) -> Callable[[str, Path], tuple[OrdinanceMeta, Path]]:
    def _f(doc_id: str, cache_dir: Path) -> tuple[OrdinanceMeta, Path]:
        raise NotImplementedError(
            f"fetch for {city_label} not implemented — see local_ordinances.py "
            f"for the Makati pattern."
        )
    return _f


def _make_stub(city_label: str, hint: str) -> CityPlugin:
    def discover_fn() -> list[OrdinanceMeta]:
        return _stub_discover(city_label, hint)
    return (discover_fn, _stub_fetch(city_label))


# Hints below note the canonical entry point we'd start from. Verify and
# update when implementing.
PLUGINS: dict[str, CityPlugin] = {
    "makati": (_discover_makati, _fetch_makati),
    "taguig": _make_stub(
        "Taguig",
        "Entry: https://taguig.gov.ph — look for 'Ordinances' or 'Transparency'.",
    ),
    "quezon-city": _make_stub(
        "Quezon City",
        "Entry: https://quezoncity.gov.ph — search 'ordinance' filings.",
    ),
    "manila": _make_stub(
        "Manila",
        "Entry: https://manila.gov.ph — Sanggunian Panlungsod records.",
    ),
    "pasig": _make_stub("Pasig", "Entry: https://pasigcity.gov.ph"),
    "mandaluyong": _make_stub("Mandaluyong", "Entry: https://mandaluyong.gov.ph"),
    "pasay": _make_stub("Pasay", "Entry: https://pasaycity.gov.ph"),
    "paranaque": _make_stub("Parañaque", "Entry: https://www.paranaquecity.gov.ph"),
    "marikina": _make_stub("Marikina", "Entry: https://marikina.gov.ph"),
    "caloocan": _make_stub("Caloocan", "Entry: https://caloocancity.gov.ph"),
    "las-pinas": _make_stub("Las Piñas", "Entry: https://laspinascity.gov.ph"),
    "muntinlupa": _make_stub("Muntinlupa", "Entry: https://www.muntinlupacity.gov.ph"),
    "valenzuela": _make_stub("Valenzuela", "Entry: https://www.valenzuela.gov.ph"),
    "malabon": _make_stub("Malabon", "Entry: https://www.malabon.gov.ph"),
    "navotas": _make_stub("Navotas", "Entry: https://www.navotas.gov.ph"),
    "san-juan": _make_stub("San Juan", "Entry: https://www.sanjuancity.gov.ph"),
    "pateros": _make_stub("Pateros", "Entry: https://pateros.gov.ph"),
    "cebu-city": _make_stub("Cebu City", "Entry: https://www.cebucity.gov.ph"),
    "davao-city": _make_stub("Davao City", "Entry: https://www.davaocity.gov.ph"),
    "iloilo-city": _make_stub("Iloilo City", "Entry: https://iloilocity.gov.ph"),
}


def discover(city: str) -> list[OrdinanceMeta]:
    plugin = PLUGINS.get(city.lower())
    if not plugin:
        raise ValueError(
            f"unknown city: {city}. Known: {', '.join(sorted(PLUGINS.keys()))}"
        )
    discover_fn, _ = plugin
    return discover_fn()


def fetch(city: str, doc_id: str, *, cache_dir: Path) -> tuple[OrdinanceMeta, Path]:
    plugin = PLUGINS.get(city.lower())
    if not plugin:
        raise ValueError(f"unknown city: {city}")
    _, fetch_fn = plugin
    return fetch_fn(doc_id, cache_dir)


def cities() -> list[str]:
    return sorted(PLUGINS.keys())


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _extract_year(text: str) -> str | None:
    m = re.search(r"\b(20\d{2})\b", text)
    return m.group(1) if m else None


def _extract_date_from_text(text: str) -> str | None:
    iso = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", text)
    if iso:
        return iso.group(0)
    longform = re.search(
        r"\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b",
        text,
    )
    if longform:
        return longform.group(0)
    return None
