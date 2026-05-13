"""CLI entry points.

Usage examples:
  ponente-ingest discover --year 2025 --months Jan,Feb,Mar
  ponente-ingest crawl --limit 100
  ponente-ingest text --limit 100
  ponente-ingest meta --limit 100
  ponente-ingest chunk --limit 100
  ponente-ingest embed --limit 50
  ponente-ingest pipeline --year 2025 --months Apr --limit 10
  ponente-ingest status
"""

from __future__ import annotations

import sys

import click
from rich.console import Console
from rich.table import Table

from ingestion import pipeline as pipeline_mod
from ingestion.config import load_config, load_config_lenient
from ingestion.crawl.sc_elibrary import MONTH_ABBRS
from ingestion.logging import configure as configure_logging
from ingestion.state import StateDB

console = Console()


def _open_state() -> StateDB:
    cfg = load_config_lenient()
    if cfg is None:
        # status / list don't need API keys, only the state path. Default it.
        from pathlib import Path

        return StateDB(Path("state.db"))
    cfg.ensure_dirs()
    return StateDB(cfg.state_db)


def _months_arg(value: str) -> list[str]:
    months = [m.strip() for m in value.split(",") if m.strip()]
    invalid = [m for m in months if m not in MONTH_ABBRS]
    if invalid:
        raise click.BadParameter(
            f"unknown months: {invalid}. valid: {MONTH_ABBRS}"
        )
    return months


@click.group()
@click.option(
    "--log-level",
    default="INFO",
    type=click.Choice(["DEBUG", "INFO", "WARNING", "ERROR"]),
)
@click.pass_context
def main(ctx: click.Context, log_level: str) -> None:
    """Ponente ingestion CLI."""
    cfg = load_config_lenient()
    log_dir = cfg.log_dir if cfg else None
    if cfg:
        cfg.ensure_dirs()
    configure_logging(level=log_level, log_dir=log_dir)
    ctx.ensure_object(dict)


@main.command()
@click.option("--year", type=int, required=True)
@click.option(
    "--months",
    type=str,
    required=True,
    help="Comma-separated month abbrs, e.g. Jan,Feb,Mar",
)
def discover(year: int, months: str) -> None:
    """Walk month indices on SC e-Library; register decision IDs in state."""
    load_config()  # require API keys (crawler needs them on subsequent runs)
    state = _open_state()
    months_list = _months_arg(months)
    new = pipeline_mod.run_discover(state, year=year, months=months_list)
    console.print(f"[green]registered {new} new decisions")


@main.command()
@click.option("--limit", type=int, default=None)
def crawl(limit: int | None) -> None:
    """Download PDFs for crawl-pending decisions."""
    load_config()
    state = _open_state()
    pipeline_mod.run_crawl(state, limit=limit)


@main.command(name="text")
@click.option("--limit", type=int, default=None)
def text_cmd(limit: int | None) -> None:
    """Extract text from cached PDFs (pdfminer first, OCR fallback)."""
    load_config()
    state = _open_state()
    pipeline_mod.run_text(state, limit=limit)


@main.command()
@click.option("--limit", type=int, default=None)
def meta(limit: int | None) -> None:
    """Run Gemini Flash to extract structured metadata from decision text."""
    load_config()
    state = _open_state()
    pipeline_mod.run_meta(state, limit=limit)


@main.command()
@click.option("--limit", type=int, default=None)
def chunk(limit: int | None) -> None:
    """Chunk decision text into ~1500-char passages."""
    state = _open_state()
    pipeline_mod.run_chunk(state, limit=limit)


@main.command()
@click.option("--limit", type=int, default=None)
def embed(limit: int | None) -> None:
    """Embed chunks via Voyage and upsert to Supabase."""
    load_config()
    state = _open_state()
    pipeline_mod.run_embed_and_upsert(state, limit=limit)


@main.command()
@click.option("--year", type=int, required=True)
@click.option("--months", type=str, required=True)
@click.option("--limit", type=int, default=None, help="Per-stage limit")
def pipeline(year: int, months: str, limit: int | None) -> None:
    """Run all stages sequentially. Useful for small bootstrap runs."""
    load_config()
    state = _open_state()
    months_list = _months_arg(months)
    summary = pipeline_mod.run_pipeline(state, year=year, months=months_list, limit_per_stage=limit)
    table = Table(title="pipeline summary")
    table.add_column("stage")
    table.add_column("count", justify="right")
    for stage, count in summary.items():
        table.add_row(stage, str(count))
    console.print(table)


@main.command()
def status() -> None:
    """Show counts by stage and status."""
    state = _open_state()
    summary = state.status_summary()
    table = Table(title="ingestion state")
    table.add_column("stage")
    for status_label in ("pending", "ok", "failed", "skipped"):
        table.add_column(status_label, justify="right")
    for stage, counts in summary.items():
        table.add_row(
            stage,
            str(counts["pending"]),
            f"[green]{counts['ok']}",
            f"[red]{counts['failed']}",
            f"[yellow]{counts['skipped']}",
        )
    console.print(table)


@main.command(name="show")
@click.argument("doc_id")
def show_cmd(doc_id: str) -> None:
    """Show all state for one decision."""
    state = _open_state()
    row = state.get(doc_id)
    if not row:
        console.print(f"[red]no row for doc_id={doc_id}")
        sys.exit(1)
    table = Table(title=f"decision {doc_id}")
    table.add_column("field")
    table.add_column("value")
    for field_name in (
        "doc_id",
        "source_url",
        "crawl_status",
        "text_status",
        "text_method",
        "meta_status",
        "chunk_status",
        "chunk_count",
        "embed_status",
        "upsert_status",
        "document_id",
        "pdf_path",
        "text_path",
        "last_error",
    ):
        value = getattr(row, field_name)
        table.add_row(field_name, str(value) if value is not None else "")
    console.print(table)


if __name__ == "__main__":
    main()
