"""Structured metadata extraction from raw decision text via Gemini Flash."""

from ingestion.extract.metadata import (
    ExtractedMetadata,
    extract_metadata,
)

__all__ = ["ExtractedMetadata", "extract_metadata"]
