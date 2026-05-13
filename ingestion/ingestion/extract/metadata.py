"""LLM-driven metadata extraction.

Gemini 2.5 Flash is cheap and good at structured extraction — perfect for
pulling docket number, ponente, division, syllabus, and practice-area tags
out of a raw SC decision.

Returns a dataclass; the orchestrator JSON-encodes it for storage.

Uses the new `google-genai` SDK (the legacy `google-generativeai` is
deprecated as of late 2025).
"""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass, field

from google import genai
from google.genai import types as genai_types
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from ingestion.config import load_config
from ingestion.logging import get_logger

log = get_logger(__name__)

MODEL_NAME = "gemini-2.5-flash"

# Practice-area taxonomy — must match the canonical list in
# ponente-ai/lib/draft/practice-areas.ts so chat filter chips work.
PRACTICE_AREAS = [
    "civil",
    "criminal",
    "labor",
    "tax",
    "corporate",
    "family",
    "remedial",
    "constitutional",
    "ip",
    "admin",
    "election",
    "mercantile",
    "legal_ethics",
]


@dataclass
class ExtractedMetadata:
    docket_number: str | None = None  # "G.R. No. 196444" or "A.C. No. 12345"
    case_title: str | None = None  # "Solid Homes v. Spouses Tan"
    promulgated: str | None = None  # ISO YYYY-MM-DD if parseable
    ponente: str | None = None  # "J. Carpio"
    division: str | None = None  # "En Banc" | "First Division" | ...
    syllabus: str | None = None  # 1-2 paragraphs summary
    dispositive: str | None = None  # the WHEREFORE clause
    practice_areas: list[str] = field(default_factory=list)


_client_singleton: genai.Client | None = None


def _client() -> genai.Client:
    global _client_singleton
    if _client_singleton is None:
        _client_singleton = genai.Client(api_key=load_config().google_ai_api_key)
    return _client_singleton


_SYSTEM_PROMPT = """You extract structured metadata from Philippine Supreme Court decisions.

Given the raw text of a decision, return JSON with these fields:
- docket_number: string or null. Format: "G.R. No. 196444" or "A.C. No. 12345-CA"
- case_title: string or null. Short form: "Plaintiff v. Defendant"
- promulgated: string YYYY-MM-DD or null
- ponente: string or null. Just the surname-led short form: "Carpio, J." or "Per Curiam"
- division: one of "En Banc" | "First Division" | "Second Division" | "Third Division" | null
- syllabus: 1-2 paragraph plain-English summary (your own words). 200-400 chars.
- dispositive: the WHEREFORE clause verbatim (truncate at 1500 chars if longer). null if not found.
- practice_areas: array of slugs from this fixed list (zero or more — pick what's actually relevant):
  ["civil", "criminal", "labor", "tax", "corporate", "family", "remedial", "constitutional", "ip", "admin", "election", "mercantile", "legal_ethics"]

Return ONLY valid JSON. No prose, no code fences."""


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=2, min=2, max=20),
    retry=retry_if_exception_type(Exception),
    reraise=True,
)
def _generate(prompt: str) -> str:
    response = _client().models.generate_content(
        model=MODEL_NAME,
        contents=[prompt],
        config=genai_types.GenerateContentConfig(
            system_instruction=_SYSTEM_PROMPT,
            temperature=0,
            response_mime_type="application/json",
        ),
    )
    return response.text or ""


def extract_metadata(decision_text: str) -> ExtractedMetadata:
    """Run Gemini Flash on the decision body. Truncates very long decisions."""
    truncated = decision_text[:60_000]  # ~15k tokens — well under Flash's window
    raw = _generate(truncated)
    parsed = _parse_json(raw)

    # Validate practice areas against the canonical taxonomy.
    pa = parsed.get("practice_areas") or []
    if isinstance(pa, list):
        parsed["practice_areas"] = [
            p for p in pa if isinstance(p, str) and p in PRACTICE_AREAS
        ]
    else:
        parsed["practice_areas"] = []

    # Coerce to dataclass.
    return ExtractedMetadata(
        docket_number=_str_or_none(parsed.get("docket_number")),
        case_title=_str_or_none(parsed.get("case_title")),
        promulgated=_normalize_date(_str_or_none(parsed.get("promulgated"))),
        ponente=_str_or_none(parsed.get("ponente")),
        division=_str_or_none(parsed.get("division")),
        syllabus=_str_or_none(parsed.get("syllabus")),
        dispositive=_str_or_none(parsed.get("dispositive")),
        practice_areas=parsed["practice_areas"],
    )


def to_json(meta: ExtractedMetadata) -> str:
    return json.dumps(asdict(meta), ensure_ascii=False)


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _parse_json(raw: str) -> dict:
    """Tolerate the occasional code-fenced response."""
    raw = raw.strip()
    fenced = re.match(r"^```(?:json)?\s*(.+?)\s*```$", raw, flags=re.DOTALL)
    if fenced:
        raw = fenced.group(1)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        log.warning("Gemini returned non-JSON: %s", raw[:200])
        raise RuntimeError(f"metadata extraction returned invalid JSON: {e}") from e


def _str_or_none(value) -> str | None:  # noqa: ANN001
    if value is None:
        return None
    s = str(value).strip()
    return s or None


def _normalize_date(value: str | None) -> str | None:
    """Coerce common date formats to ISO YYYY-MM-DD when feasible."""
    if not value:
        return None
    iso = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", value)
    if iso:
        return value
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }
    longform = re.match(
        r"^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$",
        value.strip(),
    )
    if longform:
        m = months.get(longform.group(1).lower())
        if m:
            return f"{int(longform.group(3)):04d}-{m:02d}-{int(longform.group(2)):02d}"
    return value  # leave unparseable as-is
