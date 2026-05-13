# ingestion/

Philippine Supreme Court e-Library scraper + OCR + embedder. Feeds the Ponente app's `legal_documents` + `legal_chunks` tables in Supabase. Lives in the same repo as the Next.js app at `ponente-ai/ingestion/`.

Phase 1c of the Ponente plan. Designed to backfill the last 5 years of SC decisions (~12,500 PDFs) into pgvector, then keep them updated on a schedule.

## Architecture

```
SC e-Library
   │   discover_month / fetch_decision  (crawl/)
   ▼
PDF cache (ingestion/cache/pdf/<doc_id>.pdf)
   │   pdfminer first, pytesseract OCR fallback  (ocr/)
   ▼
Text cache (ingestion/cache/text/<doc_id>.txt)
   │   Gemini 2.5 Flash → docket, ponente, division, syllabus, ...  (extract/)
   ▼
Metadata (ingestion/state.db)
   │   ~1500-char chunks with sentence-aware boundaries  (chunk/)
   ▼
Chunk list
   │   voyage-law-2 → 1024d vectors  (embed/)
   ▼
Embedded chunks
   │   PostgREST upsert with service-role key  (upsert/)
   ▼
Supabase: legal_documents + legal_chunks
```

Each stage's progress is tracked in a local SQLite `state.db`. Re-running picks up where it left off; per-decision failures don't kill the batch.

## Prerequisites

- **uv** for Python + dep management. https://docs.astral.sh/uv/
- **Tesseract OCR** for the OCR fallback. Windows: `winget install -e --id UB-Mannheim.TesseractOCR`. macOS: `brew install tesseract`. Linux: `apt install tesseract-ocr`.
- **Poppler** for `pdf2image`. Windows: `winget install -e --id oschwartz10612.Poppler` (then add `bin\` to PATH). macOS: `brew install poppler`. Linux: `apt install poppler-utils`.
- API keys: Voyage AI, Supabase service-role, Google Gemini. Reuses the app's `.env.local` automatically.

## Setup

```powershell
# from the repo root
cd ingestion
uv sync                       # install Python 3.11 + deps in .venv/
uv run pytest                 # smoke-test the chunker (no network)
```

The pipeline reads `../.env.local` (the app's env file) for shared keys. You can put overrides in `ingestion/.env` if needed (gitignored). See `.env.example`.

## Usage

The CLI is a Click app. After `uv sync` you can either:

```powershell
uv run ponente-ingest <command>          # via the installed entry point
uv run python -m ingestion.cli <command> # via module
```

Always run from inside `ingestion/` (the cache, state DB, and logs default to paths inside this directory).

### Stage commands

| Command | What |
|---|---|
| `discover --year 2025 --months Jan,Feb,Mar` | Walk SC e-Library month indices, register decision IDs in state |
| `crawl [--limit N]` | Download PDFs for crawl-pending decisions |
| `text [--limit N]` | Extract text (pdfminer first, OCR fallback) |
| `meta [--limit N]` | Run Gemini Flash for structured metadata |
| `chunk [--limit N]` | Chunk decision text into passages |
| `embed [--limit N]` | Embed chunks via Voyage + upsert to Supabase |
| `status` | Show counts by stage and status |
| `show <doc_id>` | Inspect one decision's full state |

### All-in-one

```powershell
uv run ponente-ingest pipeline --year 2025 --months Apr --limit 5
```

Runs `discover → crawl → text → meta → chunk → embed+upsert` for one month, capping each stage at 5 decisions. Good for the first smoke test.

## Recommended bootstrap

```powershell
# 1. Smoke test with 1 month, 5 decisions, end-to-end
uv run ponente-ingest pipeline --year 2025 --months Apr --limit 5

# 2. Inspect one of them
uv run ponente-ingest show <doc_id>

# 3. Backfill last 5 years, one stage at a time so you can monitor
uv run ponente-ingest discover --year 2026 --months Jan,Feb,Mar,Apr,May
uv run ponente-ingest discover --year 2025 --months Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec
uv run ponente-ingest discover --year 2024 --months Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec
# ...etc to 2021

uv run ponente-ingest crawl                  # downloads all
uv run ponente-ingest text                   # extracts all
uv run ponente-ingest meta --limit 200       # batch-throttle Gemini
uv run ponente-ingest chunk
uv run ponente-ingest embed --limit 100      # batch-throttle Voyage + Supabase
```

## Environment variables

Reads `../.env.local` (the app's env) automatically; `ingestion/.env` overrides any shared values. Required keys:

- `VOYAGE_API_KEY` — embeddings
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL` from the app) + `SUPABASE_SERVICE_ROLE_KEY` — upsert target
- `GOOGLE_AI_API_KEY` — Gemini Flash for metadata extraction

Optional:

- `CRAWLER_RATE_LIMIT_SECONDS` (default 2.0) — min wait between requests to elibrary.judiciary.gov.ph
- `CRAWLER_USER_AGENT` (default identifies us)
- `CACHE_DIR` (default `cache/`) — where PDFs and text are cached (resolved under `ingestion/`)
- `STATE_DB` (default `state.db`) — SQLite progress tracker (resolved under `ingestion/`)

## Resilience

- **Idempotent stages** — every step is keyed on `doc_id`. Re-running picks up where it left off.
- **Polite crawling** — single global rate limiter; identifies itself in User-Agent.
- **Per-decision failure isolation** — exceptions log + mark the row failed; the batch continues.
- **Retry with backoff** — network errors retry up to 4 times with exponential backoff (Voyage, Supabase, e-Library).

## What's NOT here yet

- **Document AI fallback** for the ~5% of pre-2010 scanned PDFs that pytesseract can't handle. Wire when we tackle pre-2021 backfill.
- **Republic Acts ingestion**. Different source (officialgazette.gov.ph), separate scraper.
- **Constitution + Codes**. Hand-curated already; use the JS script in the main app's `corpus/` for those.
- **BIR/SEC/BSP/DOLE scrapers**. Stub modules in `ingestion/crawl/admin_issuances.py` — fill in the agency-specific HTML parsers.
- **Scheduled re-crawls** for new decisions. Add a cron-driven nightly run when V1 launches.

## Layout

```
ingestion/                     <- this folder; uv project root
├── pyproject.toml
├── .env.example
├── README.md (this file)
├── ingestion/                 <- the actual Python package
│   ├── config.py              # env loading, paths
│   ├── state.py               # SQLite tracker
│   ├── logging.py             # rich console + file logs
│   ├── crawl/sc_elibrary.py   # polite scraper
│   ├── crawl/admin_issuances.py # BIR/SEC/BSP/DOLE stubs
│   ├── ocr/extract.py         # pdfminer + tesseract
│   ├── extract/metadata.py    # Gemini Flash structured extraction
│   ├── chunk/semantic.py      # ~1500-char passages
│   ├── embed/voyage.py        # voyage-law-2 batched
│   ├── upsert/supabase.py     # PostgREST service-role upsert
│   ├── pipeline.py            # orchestrator
│   └── cli.py                 # Click entry points
└── tests/
    └── test_chunk.py
```
