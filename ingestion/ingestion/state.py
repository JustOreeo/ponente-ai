"""SQLite-backed pipeline state tracker.

Each SC decision moves through stages: crawled → text-extracted → metadata-
extracted → chunked → embedded → upserted. The tracker records each stage so
re-running picks up where it left off.

The schema is intentionally simple — one row per decision, one column per
stage status.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal

Stage = Literal["crawl", "text", "meta", "chunk", "embed", "upsert"]
Status = Literal["pending", "ok", "failed", "skipped"]

_SCHEMA = """
create table if not exists decisions (
  doc_id text primary key,
  source_url text,

  crawl_status text default 'pending',
  crawl_at text,
  pdf_path text,

  text_status text default 'pending',
  text_at text,
  text_path text,
  text_method text,            -- 'pdfminer' | 'tesseract' | 'document_ai'

  meta_status text default 'pending',
  meta_at text,
  meta_json text,              -- JSON-encoded extracted metadata

  chunk_status text default 'pending',
  chunk_at text,
  chunk_count integer,

  embed_status text default 'pending',
  embed_at text,

  upsert_status text default 'pending',
  upsert_at text,
  document_id text,            -- legal_documents.id (UUID) once upserted

  last_error text,
  last_error_at text,

  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create index if not exists decisions_source on decisions (source);
create index if not exists decisions_crawl_status on decisions (crawl_status);
create index if not exists decisions_text_status on decisions (text_status);
create index if not exists decisions_meta_status on decisions (meta_status);
create index if not exists decisions_chunk_status on decisions (chunk_status);
create index if not exists decisions_embed_status on decisions (embed_status);
create index if not exists decisions_upsert_status on decisions (upsert_status);
"""

# Schema migrations applied per-open. Add new statements here as the schema
# evolves; each must be idempotent (use try/except for ALTER, etc.).
_MIGRATIONS = [
    # v2 — add `source` column for multi-agency state
    "alter table decisions add column source text not null default 'sc_elibrary'",
]


@dataclass
class DecisionRow:
    doc_id: str
    source: str  # 'sc_elibrary' | 'bir' | 'sec' | 'bsp' | 'dole'
    source_url: str | None
    crawl_status: Status
    text_status: Status
    meta_status: Status
    chunk_status: Status
    embed_status: Status
    upsert_status: Status
    pdf_path: str | None
    text_path: str | None
    text_method: str | None
    meta_json: str | None
    chunk_count: int | None
    document_id: str | None
    last_error: str | None


class StateDB:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._conn = sqlite3.connect(path, isolation_level=None)  # autocommit
        self._conn.row_factory = sqlite3.Row
        self._conn.execute("pragma journal_mode = wal")
        self._conn.execute("pragma synchronous = normal")
        self._conn.executescript(_SCHEMA)
        # Apply migrations idempotently — each is a single ALTER that throws
        # OperationalError if the column already exists. Catching keeps it
        # safe to re-run on existing DBs.
        for stmt in _MIGRATIONS:
            try:
                self._conn.execute(stmt)
            except sqlite3.OperationalError:
                pass

    def close(self) -> None:
        self._conn.close()

    @contextmanager
    def tx(self) -> Iterator[sqlite3.Connection]:
        """Run a batch of statements as a transaction."""
        try:
            self._conn.execute("begin")
            yield self._conn
            self._conn.execute("commit")
        except Exception:
            self._conn.execute("rollback")
            raise

    # -----------------------------------------------------------------------
    # Discovery — called by the crawler to register newly-found doc IDs.
    # -----------------------------------------------------------------------
    def register_discovered(
        self,
        doc_id: str,
        source_url: str | None = None,
        *,
        source: str = "sc_elibrary",
    ) -> bool:
        """Insert a row if not already present. Returns True if inserted."""
        cur = self._conn.execute(
            "insert or ignore into decisions (doc_id, source_url, source) values (?, ?, ?)",
            (doc_id, source_url, source),
        )
        return cur.rowcount > 0

    # -----------------------------------------------------------------------
    # Stage updates
    # -----------------------------------------------------------------------
    def mark_crawled(
        self,
        doc_id: str,
        *,
        pdf_path: str,
        source_url: str | None = None,
    ) -> None:
        self._conn.execute(
            """
            update decisions
            set crawl_status = 'ok',
                crawl_at = ?,
                pdf_path = ?,
                source_url = coalesce(?, source_url),
                updated_at = ?
            where doc_id = ?
            """,
            (_now(), pdf_path, source_url, _now(), doc_id),
        )

    def mark_text_extracted(
        self,
        doc_id: str,
        *,
        text_path: str,
        method: str,
    ) -> None:
        self._conn.execute(
            """
            update decisions
            set text_status = 'ok',
                text_at = ?,
                text_path = ?,
                text_method = ?,
                updated_at = ?
            where doc_id = ?
            """,
            (_now(), text_path, method, _now(), doc_id),
        )

    def mark_metadata(self, doc_id: str, *, meta_json: str) -> None:
        self._conn.execute(
            """
            update decisions
            set meta_status = 'ok',
                meta_at = ?,
                meta_json = ?,
                updated_at = ?
            where doc_id = ?
            """,
            (_now(), meta_json, _now(), doc_id),
        )

    def mark_chunked(self, doc_id: str, *, chunk_count: int) -> None:
        self._conn.execute(
            """
            update decisions
            set chunk_status = 'ok',
                chunk_at = ?,
                chunk_count = ?,
                updated_at = ?
            where doc_id = ?
            """,
            (_now(), chunk_count, _now(), doc_id),
        )

    def mark_embedded(self, doc_id: str) -> None:
        self._conn.execute(
            """
            update decisions
            set embed_status = 'ok',
                embed_at = ?,
                updated_at = ?
            where doc_id = ?
            """,
            (_now(), _now(), doc_id),
        )

    def mark_upserted(self, doc_id: str, *, document_id: str) -> None:
        self._conn.execute(
            """
            update decisions
            set upsert_status = 'ok',
                upsert_at = ?,
                document_id = ?,
                updated_at = ?
            where doc_id = ?
            """,
            (_now(), document_id, _now(), doc_id),
        )

    def mark_failed(self, doc_id: str, stage: Stage, error: str) -> None:
        column = f"{stage}_status"
        self._conn.execute(
            f"""
            update decisions
            set {column} = 'failed',
                last_error = ?,
                last_error_at = ?,
                updated_at = ?
            where doc_id = ?
            """,
            (error[:2000], _now(), _now(), doc_id),
        )

    def mark_skipped(self, doc_id: str, stage: Stage, reason: str) -> None:
        column = f"{stage}_status"
        self._conn.execute(
            f"""
            update decisions
            set {column} = 'skipped',
                last_error = ?,
                last_error_at = ?,
                updated_at = ?
            where doc_id = ?
            """,
            (reason[:2000], _now(), _now(), doc_id),
        )

    # -----------------------------------------------------------------------
    # Queries — used by the orchestrator to find what's next.
    # -----------------------------------------------------------------------
    def pending(self, stage: Stage, limit: int | None = None) -> list[DecisionRow]:
        """Return decisions where the given stage is 'pending' AND prereqs are 'ok'.

        Stage prerequisite chain:
          crawl   → no prereqs
          text    → crawl_status = 'ok'
          meta    → text_status = 'ok'
          chunk   → text_status = 'ok' AND meta_status = 'ok'
          embed   → chunk_status = 'ok'
          upsert  → embed_status = 'ok' AND meta_status = 'ok'
        """
        prereq = {
            "crawl": None,
            "text": "crawl_status = 'ok'",
            "meta": "text_status = 'ok'",
            "chunk": "text_status = 'ok' and meta_status = 'ok'",
            "embed": "chunk_status = 'ok'",
            "upsert": "embed_status = 'ok' and meta_status = 'ok'",
        }[stage]
        column = f"{stage}_status"
        where = f"{column} = 'pending'"
        if prereq:
            where += f" and {prereq}"
        sql = f"select * from decisions where {where} order by doc_id"
        if limit:
            sql += f" limit {int(limit)}"
        return [_row(r) for r in self._conn.execute(sql)]

    def get(self, doc_id: str) -> DecisionRow | None:
        row = self._conn.execute(
            "select * from decisions where doc_id = ?", (doc_id,)
        ).fetchone()
        return _row(row) if row else None

    def all_doc_ids(self) -> Iterable[str]:
        return [r[0] for r in self._conn.execute("select doc_id from decisions order by doc_id")]

    def status_summary(self) -> dict[Stage, dict[Status, int]]:
        out: dict[Stage, dict[Status, int]] = {}
        for stage in ("crawl", "text", "meta", "chunk", "embed", "upsert"):
            out[stage] = {"pending": 0, "ok": 0, "failed": 0, "skipped": 0}
            sql = f"select {stage}_status, count(*) from decisions group by {stage}_status"
            for status, count in self._conn.execute(sql):
                if status in out[stage]:
                    out[stage][status] = count
        return out


def _row(r: sqlite3.Row) -> DecisionRow:
    return DecisionRow(
        doc_id=r["doc_id"],
        source=r["source"] if "source" in r.keys() else "sc_elibrary",
        source_url=r["source_url"],
        crawl_status=r["crawl_status"],
        text_status=r["text_status"],
        meta_status=r["meta_status"],
        chunk_status=r["chunk_status"],
        embed_status=r["embed_status"],
        upsert_status=r["upsert_status"],
        pdf_path=r["pdf_path"],
        text_path=r["text_path"],
        text_method=r["text_method"],
        meta_json=r["meta_json"],
        chunk_count=r["chunk_count"],
        document_id=r["document_id"],
        last_error=r["last_error"],
    )


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")
