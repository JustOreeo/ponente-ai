"""PDF text extraction — text-native first, OCR fallback."""

from ingestion.ocr.extract import extract_text

__all__ = ["extract_text"]
