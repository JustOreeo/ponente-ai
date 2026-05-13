"""End-to-end pipeline orchestrator.

Each stage is idempotent and resumable thanks to StateDB. Re-running picks
up where it left off, and per-document failures don't kill the batch.

Sources supported:
  sc_elibrary  — Supreme Court decisions (default; date-indexed by month)
  republic_act — RAs from officialgazette.gov.ph
  bir|sec|bsp|dole — agency administrative issuances
  local_<city> — local ordinances per city (e.g., local_makati)

The crawl stage branches by source:
  - sc_elibrary: fetch detail page + download PDF (uses sc_elibrary.fetch_decision)
  - everything else: discovery already captured pdf_url in state.source_url,
    so crawl just downloads that.
"""

from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

from ingestion.chunk import chunk_decision
from ingestion.config import load_config
from ingestion.crawl._http import download_to
from ingestion.crawl.admin_issuances import (
    DEFAULT_PRACTICE_AREAS as ADMIN_PRACTICE_AREAS,
)
from ingestion.crawl.admin_issuances import (
    AgencySource,
)
from ingestion.crawl.admin_issuances import (
    discover as discover_admin_source,
)
from ingestion.crawl.local_ordinances import (
    discover as discover_local_city,
)
from ingestion.crawl.republic_acts import (
    discover as discover_ra_listing,
)
from ingestion.crawl.sc_elibrary import (
    discover_month,
    fetch_decision,
)
from ingestion.embed import embed_documents
from ingestion.extract import ExtractedMetadata, extract_metadata
from ingestion.extract.metadata import to_json as meta_to_json
from ingestion.logging import get_logger
from ingestion.ocr import extract_text
from ingestion.state import StateDB
from ingestion.upsert import upsert_decision

log = get_logger(__name__)


# ---------------------------------------------------------------------------
# Discover — one entry point per source
# ---------------------------------------------------------------------------


def run_discover(state: StateDB, *, year: int, months: Sequence[str]) -> int:
    """Walk SC e-Library month indices; register newly-found decisions in state."""
    new_count = 0
    for month in months:
        log.info("discover SC %s %d", month, year)
        decisions = discover_month(year, month)
        log.info("  → %d decisions on the index", len(decisions))
        with state.tx():
            for d in decisions:
                inserted = state.register_discovered(
                    d.doc_id, source_url=d.detail_url, source="sc_elibrary"
                )
                if inserted:
                    new_count += 1
    log.info("registered %d new SC decision IDs", new_count)
    return new_count


def run_discover_ra(state: StateDB, *, max_pages: int = 1) -> int:
    """Walk Official Gazette RA listing pages; register newly-found RAs.

    Each listing page has ~20 acts. max_pages bounds the backfill depth.
    """
    log.info("discover Republic Acts (max_pages=%d)", max_pages)
    items = discover_ra_listing(max_pages=max_pages)
    log.info("  → %d RAs in listing", len(items))
    new_count = 0
    with state.tx():
        for ra in items:
            inserted = state.register_discovered(
                ra.doc_id,
                # Prefer the PDF URL when we have it (skips a detail fetch
                # during crawl); otherwise fall back to the detail page.
                source_url=ra.pdf_url or ra.detail_url,
                source="republic_act",
            )
            if inserted:
                new_count += 1
    log.info("registered %d new RAs", new_count)
    return new_count


def run_discover_admin(state: StateDB, *, source: AgencySource) -> int:
    """Walk an admin-issuance index (BIR/SEC/BSP/DOLE) and register entries."""
    log.info("discover admin issuances source=%s", source)
    items = discover_admin_source(source)
    log.info("  → %d items found", len(items))
    new_count = 0
    with state.tx():
        for item in items:
            inserted = state.register_discovered(
                item.doc_id,
                source_url=item.pdf_url or item.detail_url,
                source=source,
            )
            if inserted:
                new_count += 1
    log.info("registered %d new %s issuances", new_count, source.upper())
    return new_count


def run_discover_local(state: StateDB, *, city: str) -> int:
    """Walk a city's ordinance listing and register entries."""
    log.info("discover local ordinances city=%s", city)
    items = discover_local_city(city)
    log.info("  → %d items found", len(items))
    new_count = 0
    with state.tx():
        for item in items:
            inserted = state.register_discovered(
                item.doc_id,
                source_url=item.pdf_url or item.detail_url,
                source=f"local_{city}",
            )
            if inserted:
                new_count += 1
    log.info("registered %d new ordinances for %s", new_count, city)
    return new_count


# ---------------------------------------------------------------------------
# Crawl — branches by source
# ---------------------------------------------------------------------------


def run_crawl(state: StateDB, *, limit: int | None = None) -> int:
    cfg = load_config()
    pending = state.pending("crawl", limit=limit)
    log.info("crawl: %d pending", len(pending))
    ok = 0
    for row in pending:
        try:
            if row.source == "sc_elibrary":
                metadata, pdf_path = fetch_decision(row.doc_id, cache_dir=cfg.pdf_cache)
                state.mark_crawled(
                    row.doc_id,
                    pdf_path=str(pdf_path),
                    source_url=metadata.detail_url,
                )
            else:
                # All other sources stored pdf_url in source_url at discovery.
                if not row.source_url:
                    raise RuntimeError(
                        "source_url is empty; re-run discovery for this row"
                    )
                # Heuristic: if it looks like a PDF, download directly; otherwise
                # treat as a detail-page URL we don't know how to parse here.
                if row.source_url.lower().endswith(".pdf"):
                    dest = cfg.pdf_cache / f"{row.doc_id}.pdf"
                    download_to(row.source_url, dest)
                    state.mark_crawled(
                        row.doc_id,
                        pdf_path=str(dest),
                        source_url=row.source_url,
                    )
                else:
                    raise RuntimeError(
                        f"source={row.source} source_url is not a PDF; "
                        "implement detail-page parsing in this source's scraper "
                        "(see admin_issuances.py / republic_acts.py / local_ordinances.py)."
                    )
            ok += 1
        except Exception as e:
            log.exception("crawl failed for %s (source=%s)", row.doc_id, row.source)
            state.mark_failed(row.doc_id, "crawl", str(e))
    log.info("crawl: %d ok / %d attempted", ok, len(pending))
    return ok


# ---------------------------------------------------------------------------
# Text extraction — source-agnostic
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
            result = extract_text(Path(row.pdf_path))
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
# Metadata — source-agnostic (Gemini Flash adapts to whatever's in the text)
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
            text = Path(row.text_path).read_text(encoding="utf-8")
            meta = extract_metadata(text)
            state.mark_metadata(row.doc_id, meta_json=meta_to_json(meta))
            ok += 1
        except Exception as e:
            log.exception("metadata failed for %s", row.doc_id)
            state.mark_failed(row.doc_id, "meta", str(e))
    log.info("meta: %d ok / %d attempted", ok, len(pending))
    return ok


# ---------------------------------------------------------------------------
# Chunk
# ---------------------------------------------------------------------------


def run_chunk(state: StateDB, *, limit: int | None = None) -> int:
    pending = state.pending("chunk", limit=limit)
    log.info("chunk: %d pending", len(pending))
    ok = 0
    for row in pending:
        if not row.text_path:
            state.mark_failed(row.doc_id, "chunk", "no text_path")
            continue
        try:
            text = Path(row.text_path).read_text(encoding="utf-8")
            chunks = chunk_decision(text)
            state.mark_chunked(row.doc_id, chunk_count=len(chunks))
            ok += 1
        except Exception as e:
            log.exception("chunk failed for %s", row.doc_id)
            state.mark_failed(row.doc_id, "chunk", str(e))
    log.info("chunk: %d ok / %d attempted", ok, len(pending))
    return ok


# ---------------------------------------------------------------------------
# Embed + upsert
# ---------------------------------------------------------------------------

# Source → legal_documents.doc_type mapping. The doc_type column has a CHECK
# constraint; values must match the migration's allowed set.
_DOC_TYPE_FOR_SOURCE: dict[str, str] = {
    "sc_elibrary": "supreme_court_decision",
    "republic_act": "republic_act",
    "bir": "admin_issuance",
    "sec": "admin_issuance",
    "bsp": "admin_issuance",
    "dole": "admin_issuance",
}


def _doc_type_for(source: str) -> str:
    if source in _DOC_TYPE_FOR_SOURCE:
        return _DOC_TYPE_FOR_SOURCE[source]
    if source.startswith("local_"):
        return "local_ordinance"
    return "supreme_court_decision"  # safe fallback


def _practice_areas_for(source: str, fallback: list[str]) -> list[str]:
    """Per-source default practice areas, overlaid on whatever the metadata
    extractor produced. We use the agency map for the four admin sources.
    """
    if source in ("bir", "sec", "bsp", "dole"):
        defaults = ADMIN_PRACTICE_AREAS.get(source, [])  # type: ignore[arg-type]
        # Union: defaults + whatever the extractor decided, deduped.
        return list({*defaults, *fallback})
    return fallback


def run_embed_and_upsert(state: StateDB, *, limit: int | None = None) -> int:
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
            text = Path(row.text_path).read_text(encoding="utf-8")
            chunks = chunk_decision(text)
            if not chunks:
                state.mark_skipped(row.doc_id, "embed", "no chunks produced")
                continue

            vectors = embed_documents([c.text for c in chunks])
            state.mark_embedded(row.doc_id)

            metadata = _decode_metadata(row.meta_json)
            # Apply source-specific defaults to practice areas + doc_type.
            metadata_with_defaults = ExtractedMetadata(
                docket_number=metadata.docket_number,
                case_title=metadata.case_title,
                promulgated=metadata.promulgated,
                ponente=metadata.ponente,
                division=metadata.division,
                syllabus=metadata.syllabus,
                dispositive=metadata.dispositive,
                practice_areas=_practice_areas_for(row.source, metadata.practice_areas),
            )
            document_id = upsert_decision(
                doc_id=row.doc_id,
                source_url=row.source_url or "",
                metadata=metadata_with_defaults,
                chunks=chunks,
                embeddings=vectors,
                doc_type=_doc_type_for(row.source),
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
# All-in-one (SC e-Library only — other sources use run_discover_* + run_*)
# ---------------------------------------------------------------------------


def run_pipeline(
    state: StateDB,
    *,
    year: int,
    months: Sequence[str],
    limit_per_stage: int | None = None,
) -> dict[str, int]:
    """Run all stages sequentially for SC e-Library. Useful for bootstrap."""
    return {
        "discovered": run_discover(state, year=year, months=months),
        "crawled": run_crawl(state, limit=limit_per_stage),
        "text": run_text(state, limit=limit_per_stage),
        "meta": run_meta(state, limit=limit_per_stage),
        "chunk": run_chunk(state, limit=limit_per_stage),
        "embed_upsert": run_embed_and_upsert(state, limit=limit_per_stage),
    }
