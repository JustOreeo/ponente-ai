"""Two-stage PDF text extraction.

Stage 1: pdfminer.six on the raw PDF. Most SC decisions from ~2010+ are
text-native, so this works.

Stage 2 (fallback): rasterize via pdf2image and OCR with pytesseract. Used
when stage 1 returns suspiciously little text (likely a scanned PDF).

Stage 3 (optional, not implemented yet): Google Document AI for the ~5%
that resist tesseract. Wired only if GCP_DOCUMENT_AI_PROCESSOR_ID is set.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import StringIO
from pathlib import Path

from pdfminer.high_level import extract_text_to_fp
from pdfminer.layout import LAParams

from ingestion.logging import get_logger

log = get_logger(__name__)

# Heuristic: if a PDF averages fewer than this many characters per page after
# pdfminer extraction, we treat it as scanned and fall back to OCR.
MIN_CHARS_PER_PAGE = 200


@dataclass
class ExtractionResult:
    text: str
    method: str  # "pdfminer" | "tesseract" | "document_ai"
    pages: int


def extract_text(pdf_path: Path) -> ExtractionResult:
    """Extract text from a PDF, choosing the cheapest method that works.

    Raises on total failure (all methods exhausted).
    """
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        raise FileNotFoundError(pdf_path)

    # Stage 1: pdfminer.
    text, pages = _pdfminer_text(pdf_path)
    if pages > 0 and len(text) / pages >= MIN_CHARS_PER_PAGE:
        log.info(
            "extracted %s with pdfminer (%d chars / %d pages)",
            pdf_path.name,
            len(text),
            pages,
        )
        return ExtractionResult(text=text, method="pdfminer", pages=pages)

    # Stage 2: tesseract OCR.
    log.info(
        "pdfminer yielded too little text (%d chars / %d pages) — falling back to OCR",
        len(text),
        pages,
    )
    try:
        ocr_text, ocr_pages = _tesseract_text(pdf_path)
        if ocr_text.strip():
            return ExtractionResult(text=ocr_text, method="tesseract", pages=ocr_pages)
    except Exception as e:
        log.warning("tesseract failed for %s: %s", pdf_path.name, e)

    # Stage 3 placeholder.
    raise RuntimeError(
        f"could not extract text from {pdf_path.name} "
        f"(pdfminer={len(text)} chars, OCR also failed). "
        "Wire Document AI fallback to recover this one."
    )


def _pdfminer_text(pdf_path: Path) -> tuple[str, int]:
    """Run pdfminer over the PDF; return (text, page_count)."""
    buf = StringIO()
    laparams = LAParams(line_margin=0.5, char_margin=2.0)
    try:
        with open(pdf_path, "rb") as f:
            extract_text_to_fp(f, buf, laparams=laparams)
    except Exception as e:
        log.warning("pdfminer error on %s: %s", pdf_path.name, e)
        return "", 0
    text = buf.getvalue()
    pages = max(1, text.count("\f"))  # pdfminer separates pages with \f
    return text.strip(), pages


def _tesseract_text(pdf_path: Path) -> tuple[str, int]:
    """Rasterize each page and OCR it. Heavy — only call as a fallback."""
    # Lazy imports — these have heavy native deps (poppler, tesseract).
    import pdf2image  # type: ignore[import-untyped]
    import pytesseract  # type: ignore[import-untyped]

    images = pdf2image.convert_from_path(str(pdf_path), dpi=300)
    parts: list[str] = []
    for i, img in enumerate(images, start=1):
        page_text = pytesseract.image_to_string(img, lang="eng")
        parts.append(page_text)
        log.debug("ocr page %d/%d → %d chars", i, len(images), len(page_text))
    return ("\f".join(parts).strip(), len(images))
