"""Centralized config — env vars + paths.

Loaded once at process start via `load_config()`. Subsequent imports get the
cached value.

Env-file precedence (first found wins for any given variable):
  1. ingestion/.env                   — local override, gitignored
  2. ../.env.local                    — shared with the Next.js app
  3. ingestion/.env.example fallback  — only the placeholder layout, never values

This means `ingestion/` reuses the same `.env.local` you set up for the app.
The Supabase URL var is named `NEXT_PUBLIC_SUPABASE_URL` in the app and
`SUPABASE_URL` here — we accept either to avoid duplicating the value.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Repo layout: this file is at ponente-ai/ingestion/ingestion/config.py
# - ingestion/.env       → 2 levels up from this file
# - ../.env.local        → 3 levels up (the Next.js app's env)
_INGESTION_ROOT = Path(__file__).resolve().parents[1]
_APP_ROOT = _INGESTION_ROOT.parent


@dataclass(frozen=True)
class Config:
    # Required secrets
    voyage_api_key: str
    supabase_url: str
    supabase_service_role_key: str
    google_ai_api_key: str

    # Crawler tuning
    crawler_rate_limit_seconds: float
    crawler_user_agent: str
    cache_dir: Path
    state_db: Path

    # Optional Document AI fallback
    gcp_project_id: str | None = None
    gcp_document_ai_location: str = "us"
    gcp_document_ai_processor_id: str | None = None
    google_application_credentials: str | None = None

    # Derived paths
    pdf_cache: Path = field(init=False)
    text_cache: Path = field(init=False)
    log_dir: Path = field(init=False)

    def __post_init__(self) -> None:
        # Use object.__setattr__ since the dataclass is frozen.
        object.__setattr__(self, "pdf_cache", self.cache_dir / "pdf")
        object.__setattr__(self, "text_cache", self.cache_dir / "text")
        object.__setattr__(self, "log_dir", _INGESTION_ROOT / "logs")

    def ensure_dirs(self) -> None:
        for p in (self.cache_dir, self.pdf_cache, self.text_cache, self.log_dir):
            p.mkdir(parents=True, exist_ok=True)


def _resolve_artifact_path(env_value: str | None, default_name: str) -> Path:
    """Resolve cache/state paths relative to ingestion/ unless absolute.

    `env_value` may be None (use default), a relative path (relative to
    ingestion/), or an absolute path (used as-is).
    """
    if not env_value:
        return _INGESTION_ROOT / default_name
    p = Path(env_value)
    if p.is_absolute():
        return p
    return _INGESTION_ROOT / p


def _required(name: str, *, also_try: tuple[str, ...] = ()) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        for fallback in also_try:
            value = os.environ.get(fallback, "").strip()
            if value:
                break
    if not value:
        names = ", ".join((name, *also_try))
        raise RuntimeError(
            f"Missing required env var (tried: {names}). "
            "Set it in ingestion/.env or ../.env.local."
        )
    return value


@lru_cache(maxsize=1)
def load_config() -> Config:
    """Load + validate config. Cached after first call.

    Loads in order so later files override earlier ones for the same key:
      1. ../.env.local  (shared with the app)
      2. .env           (ingestion-only override)
    """
    load_dotenv(_APP_ROOT / ".env.local")
    load_dotenv(_INGESTION_ROOT / ".env", override=True)
    return Config(
        voyage_api_key=_required("VOYAGE_API_KEY"),
        # The Next.js app uses NEXT_PUBLIC_SUPABASE_URL; accept either.
        supabase_url=_required(
            "SUPABASE_URL", also_try=("NEXT_PUBLIC_SUPABASE_URL",)
        ).rstrip("/"),
        supabase_service_role_key=_required("SUPABASE_SERVICE_ROLE_KEY"),
        google_ai_api_key=_required("GOOGLE_AI_API_KEY"),
        crawler_rate_limit_seconds=float(
            os.environ.get("CRAWLER_RATE_LIMIT_SECONDS", "2.0")
        ),
        crawler_user_agent=os.environ.get(
            "CRAWLER_USER_AGENT",
            "Ponente-Ingestion/0.1 (+contact: hello@ponente.ph)",
        ),
        # Default cache + state DB to ingestion/cache and ingestion/state.db
        # so artifacts don't land at the app root or wherever the user happens
        # to be `cd`'d.
        cache_dir=_resolve_artifact_path(os.environ.get("CACHE_DIR"), "cache"),
        state_db=_resolve_artifact_path(os.environ.get("STATE_DB"), "state.db"),
        gcp_project_id=os.environ.get("GCP_PROJECT_ID") or None,
        gcp_document_ai_location=os.environ.get("GCP_DOCUMENT_AI_LOCATION", "us"),
        gcp_document_ai_processor_id=os.environ.get("GCP_DOCUMENT_AI_PROCESSOR_ID")
        or None,
        google_application_credentials=os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        or None,
    )


def load_config_lenient() -> Config | None:
    """Same as load_config but returns None instead of raising on missing vars.

    Used by CLI commands that read state without needing API access (status,
    list, etc.).
    """
    try:
        return load_config()
    except RuntimeError:
        return None
