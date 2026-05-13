"""End-to-end pipeline orchestrator.

Each stage is idempotent and resumable thanks to StateDB. Re-running picks
up where it left off, and per-decision failures don't kill the batch.

Public entry points:
  run_discover(year, months) — populate the state DB with decision IDs
  run_crawl(limit) — download PDFs for crawl-pending decisions
  run_text(limit) — extract text from crawl-ok PDFs
  run_meta(limit) — Gemini Flash metadata for text-ok decisions
  run_chunk(limit) — chunk text for meta-ok decisions
  run_embed_and_upsert(limit) — embed chunks + upsert to Supabase
  run_pipeline(year, months, limit) — all stages in sequence
"""

from __future__ import annotations

from collections.abc import Sequence

from ingestion.chunk import chunk_decision
from ingestion.config import load_config
from ingestion.crawl import discover_month, fetch_decision
from ingestion.embed import embed_documents
from ingestion.extract import ExtractedMetadata, extract_metadata
from ingestion.extract.metadata import to_json as meta_to_json
from ingestion.logging import get_logger
from ingestion.ocr import extract_text
from ingestion.state import StateDB
from ingestion.upsert import upsert_decision

log = get_logger(__name__)


# ---------------------------------------------------------------------------
# Stage 1 — discover
# ---------------------------------------------------------------------------


def run_discover(state: StateDB, *, year: int, months: Sequence[str]) -> int:
    """Walk SC e-Library month indices; register newly-found decisions in state."""
    new_count = 0
    for month in months:
        log.info("discover %s %d", month, year)
        decisions = discover_month(year, month)
        log.info("  → %d decisions on the index", len(decisions))
        with state.tx():
            for d in decisions:
                inserted = state.register_discovered(d.doc_id, source_url=d.detail_url)
                if inserted:
                    new_count += 1
    log.info("registered %d new decision IDs", new_count)
    return new_count


# ---------------------------------------------------------------------------
# Stage 2 — crawl PDFs
# ---------------------------------------------------------------------------


def run_crawl(state: StateDB, *, limit: int | None = None) -> int:
    cfg = load_config()
    pending = state.pending("crawl", limit=limit)
    log.info("crawl: %d pending", len(pending))
    ok = 0
    for row in pending:
        try:
            metadata, pdf_path = fetch_decision(row.doc_id, cache_dir=cfg.pdf_cache)
            state.mark_crawled(
                row.doc_id,
                pdf_path=str(pdf_path),
                source_url=metadata.detail_url,
            )
            ok += 1
        except Exception as e:
            log.exception("crawl failed for %s", row.doc_id)
            state.mark_failed(row.doc_id, "crawl", str(e))
    log.info("crawl: %d ok / %d attempted", ok, len(pending))
    return ok


# ---------------------------------------------------------------------------
# Stage 3 — extract text
# ---------------------------------------------------------------------------


def run_text(state: StateDB, *, limit: int | None = None) -> int:
    cfg = load_config()
    pending = state.pending("text", limit=limit)
    log.info("text: %d pending", len(pending))
    ok = 0
    for row in pending:
        if not row.pdf_path:
            state.mark_failed(row.doc_id, "text", "no pdf_path")
            continue
        try:
            result = extract_text(__import__("pathlib").Path(row.pdf_path))
            text_path = cfg.text_cache / f"{row.doc_id}.txt"
            text_path.write_text(result.text, encoding="utf-8")
            state.mark_text_extracted(
                row.doc_id,
                text_path=str(text_path),
                method=result.method,
            )
            ok += 1
        except Exception as e:
            log.exception("text extraction failed for %s", row.doc_id)
            state.mark_failed(row.doc_id, "text", str(e))
    log.info("text: %d ok / %d attempted", ok, len(pending))
    return ok


# ---------------------------------------------------------------------------
# Stage 4 — metadata via Gemini
# ---------------------------------------------------------------------------


def run_meta(state: StateDB, *, limit: int | None = None) -> int:
    pending = state.pending("meta", limit=limit)
    log.info("meta: %d pending", len(pending))
    ok = 0
    for row in pending:
        if not row.text_path:
            state.mark_failed(row.doc_id, "meta", "no text_path")
            continue
        try:
            text = __import__("pathlib").Path(row.text_path).read_text(encoding="utf-8")
            meta = extract_metadata(text)
            state.mark_metadata(row.doc_id, meta_json=meta_to_json(meta))
            ok += 1
        except Exception as e:
            log.exception("metadata failed for %s", row.doc_id)
            state.mark_failed(row.doc_id, "meta", str(e))
    log.info("meta: %d ok / %d attempted", ok, len(pending))
    return ok


# ---------------------------------------------------------------------------
# Stage 5 — chunk
# ---------------------------------------------------------------------------


def run_chunk(state: StateDB, *, limit: int | None = None) -> int:
    """Chunking is cheap so we re-run the whole text rather than caching chunks."""
    pending = state.pending("chunk", limit=limit)
    log.info("chunk: %d pending", len(pending))
    ok = 0
    for row in pending:
        if not row.text_path:
            state.mark_failed(row.doc_id, "chunk", "no text_path")
            continue
        try:
            text = __import__("pathlib").Path(row.text_path).read_text(encoding="utf-8")
            chunks = chunk_decision(text)
            state.mark_chunked(row.doc_id, chunk_count=len(chunks))
            ok += 1
        except Exception as e:
            log.exception("chunk failed for %s", row.doc_id)
            state.mark_failed(row.doc_id, "chunk", str(e))
    log.info("chunk: %d ok / %d attempted", ok, len(pending))
    return ok


# ---------------------------------------------------------------------------
# Stage 6+7 — embed + upsert
# ---------------------------------------------------------------------------


def run_embed_and_upsert(state: StateDB, *, limit: int | None = None) -> int:
    """Embed the chunks and upsert to Supabase in one pass.

    We don't persist embeddings between processes — there's no good local
    reason to (they're not idempotent except via Supabase, which is the
    final destination anyway).
    """
    pending = state.pending("embed", limit=limit)
    log.info("embed+upsert: %d pending", len(pending))
    ok = 0
    for row in pending:
        if not row.text_path or not row.meta_json:
            state.mark_failed(
                row.doc_id, "embed", "missing text_path or meta_json"
            )
            continue
        try:
            text = __import__("pathlib").Path(row.text_path).read_text(encoding="utf-8")
            chunks = chunk_decision(text)
            if not chunks:
                state.mark_skipped(row.doc_id, "embed", "no chunks produced")
                continue

            vectors = embed_documents([c.text for c in chunks])
            state.mark_embedded(row.doc_id)

            metadata = _decode_metadata(row.meta_json)
            document_id = upsert_decision(
                doc_id=row.doc_id,
                source_url=row.source_url or "",
                metadata=metadata,
                chunks=chunks,
                embeddings=vectors,
            )
            state.mark_upserted(row.doc_id, document_id=document_id)
            ok += 1
        except Exception as e:
            log.exception("embed+upsert failed for %s", row.doc_id)
            state.mark_failed(row.doc_id, "embed", str(e))
    log.info("embed+upsert: %d ok / %d attempted", ok, len(pending))
    return ok


def _decode_metadata(meta_json: str) -> ExtractedMetadata:
    import json

    parsed = json.loads(meta_json)
    return ExtractedMetadata(
        docket_number=parsed.get("docket_number"),
        case_title=parsed.get("case_title"),
        promulgated=parsed.get("promulgated"),
        ponente=parsed.get("ponente"),
        division=parsed.get("division"),
        syllabus=parsed.get("syllabus"),
        dispositive=parsed.get("dispositive"),
        practice_areas=parsed.get("practice_areas") or [],
    )


# ---------------------------------------------------------------------------
# All-in-one
# ---------------------------------------------------------------------------


def run_pipeline(
    state: StateDB,
    *,
    year: int,
    months: Sequence[str],
    limit_per_stage: int | None = None,
) -> dict[str, int]:
    """Run all stages sequentially. Useful for small bootstrap runs."""
    return {
        "discovered": run_discover(state, year=year, months=months),
        "crawled": run_crawl(state, limit=limit_per_stage),
        "text": run_text(state, limit=limit_per_stage),
        "meta": run_meta(state, limit=limit_per_stage),
        "chunk": run_chunk(state, limit=limit_per_stage),
        "embed_upsert": run_embed_and_upsert(state, limit=limit_per_stage),
    }
