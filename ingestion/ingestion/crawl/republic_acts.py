"""Republic Acts scraper.

Primary source: officialgazette.gov.ph
  URL pattern for the listing:
    https://officialgazette.gov.ph/section/laws/republic-acts/page/<N>/
  Per-RA permalink:
    https://officialgazette.gov.ph/YYYY/MM/DD/republic-act-no-XXXXX/

Fallback / secondary source: Senate website (more structured RA archive but
slower to index recent acts). Not used here yet.

Coverage: from R.A. 6388 (1971) onward. The Official Gazette has gaps for
older acts — flag missing IDs in the state DB rather than chasing them.

NOTE: this is scaffolding. The CSS selectors below are best-effort based on
the Official Gazette's published structure as of 2026; expect a few TODO_VERIFY
lines to require updates the first time you run this against the live site.
Run a small batch first (--limit 5) and check the output.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from bs4 import BeautifulSoup

from ingestion.crawl._http import download_to, get
from ingestion.logging import get_logger

log = get_logger(__name__)

LISTING_URL = "https://officialgazette.gov.ph/section/laws/republic-acts/page/{page}/"
_RA_NUM_RE = re.compile(r"republic-act-no-(\d+(?:-[A-Z])?)", re.IGNORECASE)
_RA_DOC_ID_PREFIX = "RA-"


@dataclass
class RAMetadata:
    """Surface metadata extracted from listing + detail pages."""
    doc_id: str  # e.g. "RA-11534"
    detail_url: str
    ra_number: str | None = None  # e.g. "11534" or "11058-A"
    title: str | None = None
    approved: str | None = None  # ISO YYYY-MM-DD if parseable
    pdf_url: str | None = None


def doc_id_for(ra_number: str) -> str:
    """Stable doc ID for an RA. Matches what the upserter checks against."""
    return f"{_RA_DOC_ID_PREFIX}{ra_number}"


def discover(*, max_pages: int = 1) -> list[RAMetadata]:
    """Walk the Official Gazette listing pages. Yields the RAs found in order.

    max_pages bounds how far back you go — each page has ~20 acts. For a full
    backfill, pass max_pages large enough (most years are ~100 acts; the
    listing covers from 1971 — that's ~1500 pages worst case).
    """
    out: list[RAMetadata] = []
    seen: set[str] = set()
    for page in range(1, max_pages + 1):
        url = LISTING_URL.format(page=page)
        log.info("crawl RA listing %s", url)
        try:
            res = get(url)
        except Exception as e:  # 404 once we pass the last page
            log.warning("stopping at page %d: %s", page, e)
            break
        items = _parse_listing(res.text)
        new = [r for r in items if r.doc_id not in seen]
        if not new:
            break
        for r in new:
            seen.add(r.doc_id)
        out.extend(new)
    return out


def fetch(doc_id: str, *, cache_dir: Path) -> tuple[RAMetadata, Path]:
    """Resolve a detail page from doc_id, find the PDF (or printable HTML),
    cache it locally, and return enriched metadata.

    Official Gazette per-RA pages don't have a uniform "download PDF" link.
    We try in order:
      1. A `<a href*=".pdf">` link
      2. The page itself rendered as HTML (we save the HTML body as the
         "source document" and let the OCR/text stage handle it)
    """
    # doc_id is "RA-<number>". The detail URL is date-prefixed and we don't
    # know the date without fetching the listing entry first. The discoverer
    # already gives us detail_url; this fallback path tries Wikipedia-style
    # disambiguation: search the Gazette for the number.
    ra_number = doc_id.removeprefix(_RA_DOC_ID_PREFIX)
    search_url = f"https://officialgazette.gov.ph/?s=republic+act+no+{ra_number}"
    log.info("resolve RA %s via search %s", doc_id, search_url)
    res = get(search_url)
    soup = BeautifulSoup(res.text, "lxml")
    detail_link = None
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if f"republic-act-no-{ra_number}" in href.lower():
            detail_link = href
            break
    if not detail_link:
        raise RuntimeError(f"no detail page found for {doc_id}")

    return _fetch_detail(detail_link, doc_id=doc_id, cache_dir=cache_dir)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _parse_listing(html: str) -> list[RAMetadata]:
    """Extract RA entries from a listing page.

    TODO_VERIFY on first live run: the Official Gazette uses Wordpress-style
    `<article class="post">` blocks but the exact class may have changed.
    If discovery returns 0, inspect the HTML and update the selectors here.
    """
    soup = BeautifulSoup(html, "lxml")
    out: list[RAMetadata] = []
    for a in soup.find_all("a", href=True):
        href: str = a["href"]
        m = _RA_NUM_RE.search(href)
        if not m:
            continue
        ra_number = m.group(1).upper()
        title = (a.get_text() or "").strip() or None
        out.append(
            RAMetadata(
                doc_id=doc_id_for(ra_number),
                detail_url=href,
                ra_number=ra_number,
                title=title,
                approved=_extract_date_near(a),
            )
        )
    # Dedupe — listing pages sometimes repeat links in nav + body.
    deduped: dict[str, RAMetadata] = {}
    for r in out:
        deduped.setdefault(r.doc_id, r)
    return list(deduped.values())


def _fetch_detail(
    detail_url: str,
    *,
    doc_id: str,
    cache_dir: Path,
) -> tuple[RAMetadata, Path]:
    log.info("fetch RA detail %s", detail_url)
    res = get(detail_url)
    soup = BeautifulSoup(res.text, "lxml")

    title = _first(soup.find("h1"), soup.title)
    approved = _extract_date_from_text(soup.get_text(" ", strip=True)[:4000])

    # Try direct PDF first.
    pdf_url: str | None = None
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.lower().endswith(".pdf"):
            pdf_url = href if href.startswith("http") else _join(detail_url, href)
            break

    ra_number = doc_id.removeprefix(_RA_DOC_ID_PREFIX)
    meta = RAMetadata(
        doc_id=doc_id,
        detail_url=detail_url,
        ra_number=ra_number,
        title=title.strip() if title else None,
        approved=approved,
        pdf_url=pdf_url,
    )

    if pdf_url:
        dest = cache_dir / f"{doc_id}.pdf"
        return meta, download_to(pdf_url, dest)

    # No PDF — save the HTML body as the source document. The text-extraction
    # stage handles plain HTML via pdfminer-on-html fallback or by reading the
    # file extension and using a different strategy. For now we write the
    # HTML and tag it with .html so the pipeline knows to text-extract it
    # differently. (text/extract.py reads .pdf only today — wire this up
    # when we run the first batch.)
    dest = cache_dir / f"{doc_id}.html"
    dest.write_text(res.text, encoding="utf-8")
    return meta, dest


def _first(*candidates) -> str | None:  # noqa: ANN001
    for c in candidates:
        if c is None:
            continue
        text = c.get_text(strip=True) if hasattr(c, "get_text") else str(c).strip()
        if text:
            return text
    return None


def _extract_date_near(anchor) -> str | None:  # noqa: ANN001
    parent = anchor.find_parent()
    if not parent:
        return None
    return _extract_date_from_text(parent.get_text(" ", strip=True))


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


def _join(base: str, href: str) -> str:
    from urllib.parse import urljoin

    return urljoin(base, href)
