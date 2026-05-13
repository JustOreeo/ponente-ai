"""Upsert one decision (document + chunks) into the Supabase Postgres DB.

Uses the service-role key against PostgREST. Bypasses RLS — we own the data.

Flow:
  1. Upsert legal_documents row (matched on metadata.doc_id == SC e-Library
     docid). Returns the row's UUID.
  2. Delete any existing legal_chunks for that document_id.
  3. Insert all new chunks in batches.
"""

from __future__ import annotations

import json

import requests
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ingestion.chunk import Chunk
from ingestion.config import load_config
from ingestion.extract import ExtractedMetadata
from ingestion.logging import get_logger

log = get_logger(__name__)

CHUNK_INSERT_BATCH = 50  # PostgREST handles ~1MB per request comfortably


@retry(
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=2, min=2, max=20),
    retry=retry_if_exception_type((requests.ConnectionError, requests.Timeout)),
    reraise=True,
)
def _request(method: str, path: str, **kwargs) -> requests.Response:
    cfg = load_config()
    url = f"{cfg.supabase_url}/rest/v1{path}"
    headers = kwargs.pop("headers", {})
    headers.setdefault("apikey", cfg.supabase_service_role_key)
    headers.setdefault("Authorization", f"Bearer {cfg.supabase_service_role_key}")
    headers.setdefault("Content-Type", "application/json")
    res = requests.request(method, url, headers=headers, timeout=60, **kwargs)
    if res.status_code >= 500:
        raise requests.ConnectionError(f"supabase {res.status_code}: {res.text[:200]}")
    return res


def upsert_decision(
    *,
    doc_id: str,
    source_url: str,
    metadata: ExtractedMetadata,
    chunks: list[Chunk],
    embeddings: list[list[float]],
    doc_type: str = "supreme_court_decision",
) -> str:
    """Upsert document + chunks. Returns the legal_documents UUID.

    `doc_type` matches the CHECK constraint on legal_documents.doc_type:
      constitution | code | republic_act | supreme_court_decision |
      executive_order | admin_issuance | local_ordinance
    """
    if len(chunks) != len(embeddings):
        raise ValueError(
            f"chunk/embedding count mismatch: {len(chunks)} vs {len(embeddings)}"
        )

    document_id = _upsert_document(
        doc_id=doc_id, source_url=source_url, metadata=metadata, doc_type=doc_type
    )
    log.info("upserted document %s (uuid=%s)", doc_id, document_id)

    _delete_existing_chunks(document_id)

    rows: list[dict] = []
    for chunk, vector in zip(chunks, embeddings, strict=True):
        rows.append(
            {
                "document_id": document_id,
                "chunk_index": chunk.index,
                "text": chunk.text,
                "embedding": vector,
                "metadata": {
                    "char_start": chunk.char_start,
                    "char_end": chunk.char_end,
                    "doc_id": doc_id,
                },
            }
        )

    for i in range(0, len(rows), CHUNK_INSERT_BATCH):
        batch = rows[i : i + CHUNK_INSERT_BATCH]
        log.info(
            "insert chunks %d-%d for document %s",
            i,
            i + len(batch),
            document_id,
        )
        res = _request(
            "POST",
            "/legal_chunks",
            data=json.dumps(batch),
            headers={"Prefer": "return=minimal"},
        )
        res.raise_for_status()

    return document_id


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _upsert_document(
    *,
    doc_id: str,
    source_url: str,
    metadata: ExtractedMetadata,
    doc_type: str,
) -> str:
    """Insert if missing, update if present (matched on metadata->>'doc_id').

    PostgREST doesn't support upsert-on-jsonb-key directly, so we do
    select-then-insert-or-update.
    """
    title = metadata.case_title or metadata.docket_number or f"Legal document {doc_id}"

    payload = {
        "title": title,
        "doc_type": doc_type,
        "source_url": source_url,
        "jurisdiction": "PH",
        "practice_areas": metadata.practice_areas or [],
        "effective_date": metadata.promulgated,
        "metadata": {
            "doc_id": doc_id,
            "docket_number": metadata.docket_number,
            "ponente": metadata.ponente,
            "division": metadata.division,
            "syllabus": metadata.syllabus,
            "dispositive": metadata.dispositive,
        },
    }

    # Look up existing row by metadata->>doc_id
    select = _request(
        "GET",
        f"/legal_documents?select=id&metadata->>doc_id=eq.{doc_id}",
    )
    select.raise_for_status()
    existing = select.json()
    if existing:
        document_id = existing[0]["id"]
        update = _request(
            "PATCH",
            f"/legal_documents?id=eq.{document_id}",
            data=json.dumps(payload),
            headers={"Prefer": "return=minimal"},
        )
        update.raise_for_status()
        return document_id

    insert = _request(
        "POST",
        "/legal_documents?select=id",
        data=json.dumps(payload),
        headers={"Prefer": "return=representation"},
    )
    insert.raise_for_status()
    rows = insert.json()
    if not rows:
        raise RuntimeError("supabase insert returned no row")
    return rows[0]["id"]


def _delete_existing_chunks(document_id: str) -> None:
    res = _request(
        "DELETE",
        f"/legal_chunks?document_id=eq.{document_id}",
        headers={"Prefer": "return=minimal"},
    )
    res.raise_for_status()
