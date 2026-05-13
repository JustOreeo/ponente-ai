"""Voyage AI embeddings — voyage-law-2, 1024d, batched.

Mirrors lib/ai/embed.ts in the Next.js app so query-side and document-side
embeddings come from the same model.
"""

from __future__ import annotations

import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ingestion.config import load_config
from ingestion.logging import get_logger

log = get_logger(__name__)

EMBEDDING_MODEL = "voyage-law-2"
EMBEDDING_DIMS = 1024
API_URL = "https://api.voyageai.com/v1/embeddings"
MAX_BATCH = 96  # Voyage allows 128 — leave headroom for token-limit retries


@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=2, min=2, max=30),
    retry=retry_if_exception_type((requests.ConnectionError, requests.Timeout)),
    reraise=True,
)
def _post(payload: dict) -> dict:
    api_key = load_config().voyage_api_key
    res = requests.post(
        API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=60,
    )
    if res.status_code == 429:
        log.warning("voyage rate-limited; will retry")
        raise requests.ConnectionError("voyage 429")
    if res.status_code >= 500:
        raise requests.ConnectionError(f"voyage {res.status_code}")
    res.raise_for_status()
    return res.json()


def embed_documents(texts: list[str]) -> list[list[float]]:
    """Embed a batch of document chunks. Splits into <=MAX_BATCH requests.

    Returns one 1024-dim vector per input, in the same order.
    """
    cleaned = [t.strip() for t in texts if t and t.strip()]
    if not cleaned:
        return []

    out: list[list[float]] = []
    for i in range(0, len(cleaned), MAX_BATCH):
        batch = cleaned[i : i + MAX_BATCH]
        log.info("voyage embed batch %d-%d", i, i + len(batch))
        body = _post(
            {
                "input": batch,
                "model": EMBEDDING_MODEL,
                "input_type": "document",
            }
        )
        data = sorted(body["data"], key=lambda d: d["index"])
        for entry in data:
            vec = entry["embedding"]
            if len(vec) != EMBEDDING_DIMS:
                raise RuntimeError(
                    f"Voyage returned {len(vec)}d vector, expected {EMBEDDING_DIMS}"
                )
            out.append(vec)
    return out
