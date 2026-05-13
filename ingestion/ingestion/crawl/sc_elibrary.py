"""Polite SC e-Library scraper.

elibrary.judiciary.gov.ph URL conventions (observed 2026-05):
  Index for a month/year:
    https://elibrary.judiciary.gov.ph/thebookshelf/docmonth/<MonAbbr>/<Year>/<page>
    e.g.  /thebookshelf/docmonth/Apr/2025/1

  Decision detail page (HTML, contains metadata + PDF link):
    https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/1/<doc_id>

This module is deliberately conservative:
  - Single global rate limit (CRAWLER_RATE_LIMIT_SECONDS between requests)
  - Identifies itself in the User-Agent
  - Retries with exponential backoff on 5xx and connection errors
  - Never parallelizes against the same host
"""

from __future__ import annotations

import re
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from tenacity import (
    RetryCallState,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from ingestion.config import load_config
from ingestion.logging import get_logger

log = get_logger(__name__)

BASE = "https://elibrary.judiciary.gov.ph"
INDEX_TEMPLATE = "/thebookshelf/docmonth/{month}/{year}/{page}"
DETAIL_TEMPLATE = "/thebookshelf/showdocs/1/{doc_id}"

MONTH_ABBRS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

_DOC_ID_RE = re.compile(r"/showdocs/1/(\d+)")
_PDF_HREF_RE = re.compile(r"\.pdf(?:[?#]|$)", re.IGNORECASE)
_GR_NUM_RE = re.compile(r"G\.?\s*R\.?\s*(?:Nos?\.?|Numbers?)?\s*([0-9\-]+)", re.IGNORECASE)
_AC_NUM_RE = re.compile(r"A\.?\s*C\.?\s*(?:No\.?)?\s*([0-9\-]+)", re.IGNORECASE)


@dataclass
class DecisionMetadata:
    """Surface-level metadata extracted from the index/detail HTML.

    Deeper structured fields (ponente, division, syllabus, dispositive,
    practice areas) are extracted later via the LLM in ingestion.extract.
    """
    doc_id: str
    detail_url: str
    title: str | None = None
    promulgated: str | None = None  # ISO YYYY-MM-DD if parseable, else raw text
    docket_number: str | None = None  # G.R. No. or A.C. No.
    pdf_url: str | None = None


class _RateLimiter:
    def __init__(self, min_interval: float) -> None:
        self.min_interval = min_interval
        self._last = 0.0
        self._lock = threading.Lock()

    def wait(self) -> None:
        with self._lock:
            now = time.monotonic()
            wait = self.min_interval - (now - self._last)
            if wait > 0:
                time.sleep(wait)
            self._last = time.monotonic()


_LIMITER: _RateLimiter | None = None
_SESSION: requests.Session | None = None


def _get_limiter() -> _RateLimiter:
    global _LIMITER
    if _LIMITER is None:
        _LIMITER = _RateLimiter(load_config().crawler_rate_limit_seconds)
    return _LIMITER


def _get_session() -> requests.Session:
    global _SESSION
    if _SESSION is None:
        s = requests.Session()
        s.headers.update(
            {
                "User-Agent": load_config().crawler_user_agent,
                "Accept": "text/html,application/xhtml+xml,application/pdf,*/*",
                "Accept-Language": "en-US,en;q=0.9",
            }
        )
        _SESSION = s
    return _SESSION


def _log_retry(state: RetryCallState) -> None:
    if state.outcome and state.outcome.failed:
        log.warning(
            "retry %s/%s for %s: %s",
            state.attempt_number,
            state.retry_object.stop.max_attempt_number  # type: ignore[union-attr]
            if hasattr(state.retry_object, "stop")
            else "?",
            state.fn.__name__ if state.fn else "?",
            state.outcome.exception(),
        )


_retry = retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    retry=retry_if_exception_type((requests.ConnectionError, requests.Timeout)),
    reraise=True,
    before_sleep=_log_retry,
)


@_retry
def _get(url: str, *, stream: bool = False, timeout: float = 30.0) -> requests.Response:
    _get_limiter().wait()
    res = _get_session().get(url, stream=stream, timeout=timeout, allow_redirects=True)
    if res.status_code >= 500:
        raise requests.ConnectionError(f"server {res.status_code} for {url}")
    res.raise_for_status()
    return res


# ---------------------------------------------------------------------------
# Public — discovery
# ---------------------------------------------------------------------------


def discover_month(year: int, month_abbr: str) -> list[DecisionMetadata]:
    """Walk all pages of one month and return surface metadata for every decision.

    `month_abbr` is a 3-letter month name as the e-Library uses
    (Jan, Feb, Mar, ...). See MONTH_ABBRS.
    """
    if month_abbr not in MONTH_ABBRS:
        raise ValueError(f"month_abbr must be one of {MONTH_ABBRS}, got {month_abbr!r}")

    out: list[DecisionMetadata] = []
    page = 1
    seen: set[str] = set()
    while True:
        path = INDEX_TEMPLATE.format(month=month_abbr, year=year, page=page)
        url = urljoin(BASE, path)
        log.info("crawl index %s", url)
        try:
            res = _get(url)
        except requests.HTTPError as e:
            if e.response is not None and e.response.status_code == 404:
                break
            raise
        decisions = _parse_index(res.text)
        if not decisions:
            break
        new = [d for d in decisions if d.doc_id not in seen]
        if not new:
            # Some servers loop pagination back to the first page when out of
            # bounds — this guards against an infinite loop.
            break
        for d in new:
            seen.add(d.doc_id)
        out.extend(new)
        page += 1
    return out


def _parse_index(html: str) -> list[DecisionMetadata]:
    """Extract decision links from a month index page.

    The e-Library renders each entry as a link to /showdocs/1/<doc_id>.
    Surrounding text usually contains the case caption and date.
    """
    soup = BeautifulSoup(html, "lxml")
    out: list[DecisionMetadata] = []
    for a in soup.find_all("a", href=True):
        href: str = a["href"]
        match = _DOC_ID_RE.search(href)
        if not match:
            continue
        doc_id = match.group(1)
        title = (a.get_text() or "").strip() or None
        promulgated = _extract_date_near(a)
        docket = _extract_docket_near(a)
        detail_url = urljoin(BASE, f"/thebookshelf/showdocs/1/{doc_id}")
        out.append(
            DecisionMetadata(
                doc_id=doc_id,
                detail_url=detail_url,
                title=title,
                promulgated=promulgated,
                docket_number=docket,
            )
        )
    return out


def _extract_date_near(anchor) -> str | None:  # noqa: ANN001 — bs4 Tag
    """Look at the anchor's parent element text for a date near the link."""
    parent = anchor.find_parent()
    if not parent:
        return None
    text = parent.get_text(" ", strip=True)
    # Match either YYYY-MM-DD, "DD Mon YYYY", or "Month DD, YYYY"
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


def _extract_docket_near(anchor) -> str | None:  # noqa: ANN001
    parent = anchor.find_parent()
    if not parent:
        return None
    text = parent.get_text(" ", strip=True)
    gr = _GR_NUM_RE.search(text)
    if gr:
        return f"G.R. No. {gr.group(1)}"
    ac = _AC_NUM_RE.search(text)
    if ac:
        return f"A.C. No. {ac.group(1)}"
    return None


# ---------------------------------------------------------------------------
# Public — single-decision fetch
# ---------------------------------------------------------------------------


def fetch_decision(doc_id: str, *, cache_dir: Path) -> tuple[DecisionMetadata, Path]:
    """Fetch the decision detail page, find the PDF link, and download it.

    Returns (enriched metadata, path to local PDF). Raises on failure.
    Idempotent — if the PDF is already cached, returns it without re-downloading.
    """
    detail_url = urljoin(BASE, DETAIL_TEMPLATE.format(doc_id=doc_id))
    pdf_path = cache_dir / f"{doc_id}.pdf"

    log.info("fetch detail %s", detail_url)
    res = _get(detail_url)
    soup = BeautifulSoup(res.text, "lxml")

    title = _first_nonempty(
        soup.title.string if soup.title and soup.title.string else None,
        _h_tag_text(soup, "h1"),
        _h_tag_text(soup, "h2"),
    )
    docket = _extract_docket_from_text(soup.get_text(" ", strip=True)[:4000])
    promulgated = _extract_date_from_text(soup.get_text(" ", strip=True)[:4000])

    pdf_href: str | None = None
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if _PDF_HREF_RE.search(href):
            pdf_href = href
            break

    pdf_url = urljoin(BASE, pdf_href) if pdf_href else None
    metadata = DecisionMetadata(
        doc_id=doc_id,
        detail_url=detail_url,
        title=title,
        promulgated=promulgated,
        docket_number=docket,
        pdf_url=pdf_url,
    )

    if pdf_path.exists() and pdf_path.stat().st_size > 0:
        log.info("pdf already cached: %s", pdf_path)
        return metadata, pdf_path

    if not pdf_url:
        raise RuntimeError(f"no PDF link found on detail page for doc_id={doc_id}")

    log.info("download pdf %s -> %s", pdf_url, pdf_path)
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    pdf_res = _get(pdf_url, stream=True)
    with open(pdf_path, "wb") as f:
        for chunk in pdf_res.iter_content(chunk_size=64 * 1024):
            if chunk:
                f.write(chunk)
    if pdf_path.stat().st_size == 0:
        pdf_path.unlink(missing_ok=True)
        raise RuntimeError(f"downloaded PDF was empty for doc_id={doc_id}")

    return metadata, pdf_path


def _first_nonempty(*values: str | None) -> str | None:
    for v in values:
        if v and v.strip():
            return v.strip()
    return None


def _h_tag_text(soup: BeautifulSoup, tag: str) -> str | None:
    el = soup.find(tag)
    if el:
        text = el.get_text(strip=True)
        if text:
            return text
    return None


def _extract_docket_from_text(text: str) -> str | None:
    gr = _GR_NUM_RE.search(text)
    if gr:
        return f"G.R. No. {gr.group(1)}"
    ac = _AC_NUM_RE.search(text)
    if ac:
        return f"A.C. No. {ac.group(1)}"
    return None


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
