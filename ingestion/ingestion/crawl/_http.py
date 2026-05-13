"""Shared HTTP helpers — single global rate limiter, retries, polite UA.

All agency scrapers (sc_elibrary, republic_acts, bir, sec, bsp, dole,
local_ordinances) use this module so we don't hammer any one host.
"""

from __future__ import annotations

import threading
import time
from pathlib import Path

import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ingestion.config import load_config
from ingestion.logging import get_logger

log = get_logger(__name__)


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


_retry = retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    retry=retry_if_exception_type((requests.ConnectionError, requests.Timeout)),
    reraise=True,
)


@_retry
def get(url: str, *, stream: bool = False, timeout: float = 30.0) -> requests.Response:
    """Polite GET — single global rate limit, retries on 5xx + connection errors."""
    _get_limiter().wait()
    res = _get_session().get(url, stream=stream, timeout=timeout, allow_redirects=True)
    if res.status_code >= 500:
        raise requests.ConnectionError(f"server {res.status_code} for {url}")
    res.raise_for_status()
    return res


def download_to(url: str, dest: Path) -> Path:
    """Stream a binary URL (typically a PDF) into `dest`. Idempotent: skips if non-empty."""
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    log.info("download %s -> %s", url, dest)
    res = get(url, stream=True)
    with open(dest, "wb") as f:
        for chunk in res.iter_content(chunk_size=64 * 1024):
            if chunk:
                f.write(chunk)
    if dest.stat().st_size == 0:
        dest.unlink(missing_ok=True)
        raise RuntimeError(f"downloaded empty file from {url}")
    return dest
