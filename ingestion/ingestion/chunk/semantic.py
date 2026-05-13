"""Chunk SC decision text into ~1500-char passages with sentence-aware splits.

Chosen size:
  - voyage-law-2 input limit is 16K tokens. 1500 chars (~375 tokens) leaves
    plenty of room for the doc-title + metadata prefix we prepend.
  - Empirically a good size for legal Q&A retrieval — small enough that one
    chunk is one rule + one citation, big enough to keep the surrounding
    sentence intact.

Overlap of 100 chars keeps citations / sentences from being orphaned at
chunk boundaries.

We don't pretend to do semantic embedding-aware chunking — paragraph and
sentence breaks are good enough at this corpus size. Iterate if recall
suffers.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

DEFAULT_TARGET_CHARS = 1500
DEFAULT_OVERLAP_CHARS = 100
MAX_CHARS = 2400  # absolute ceiling per chunk

# Sentence end: ., ?, ! followed by a space and a capital letter, OR newline.
_SENTENCE_END = re.compile(r"(?<=[.?!])\s+(?=[A-Z(\"'])|\n+")
_PARAGRAPH_BREAK = re.compile(r"\n\s*\n+")


@dataclass
class Chunk:
    index: int
    text: str
    char_start: int
    char_end: int


def chunk_decision(
    text: str,
    *,
    target_chars: int = DEFAULT_TARGET_CHARS,
    overlap_chars: int = DEFAULT_OVERLAP_CHARS,
) -> list[Chunk]:
    """Split a decision body into chunks.

    Strategy:
      1. Split on paragraph breaks first (paragraphs are natural units).
      2. If a paragraph is shorter than the target, keep accumulating until
         we cross it.
      3. If a paragraph alone exceeds the max, sentence-split it.
      4. Always carry `overlap_chars` of trailing context into the next chunk.
    """
    text = _normalize(text)
    if not text:
        return []

    paragraphs = [p.strip() for p in _PARAGRAPH_BREAK.split(text) if p.strip()]
    if not paragraphs:
        return []

    chunks: list[Chunk] = []
    buffer = ""
    cursor = 0  # char offset in original text

    def flush(buffer_text: str) -> None:
        nonlocal cursor
        if not buffer_text.strip():
            return
        idx = len(chunks)
        # Find where this chunk starts in the original text. Approximate via
        # cursor since we strip and re-join.
        start = cursor
        end = start + len(buffer_text)
        chunks.append(
            Chunk(
                index=idx,
                text=buffer_text.strip(),
                char_start=start,
                char_end=end,
            )
        )
        # Move cursor forward, retaining overlap.
        cursor = max(end - overlap_chars, end)

    for paragraph in paragraphs:
        if len(paragraph) > MAX_CHARS:
            # Hard split a giant paragraph by sentences.
            for sentence_chunk in _split_by_sentence(paragraph, target_chars, overlap_chars):
                if buffer and len(buffer) + len(sentence_chunk) + 2 > target_chars:
                    flush(buffer)
                    buffer = _carry_overlap(buffer, overlap_chars) + sentence_chunk
                else:
                    buffer = _join(buffer, sentence_chunk)
            continue

        if not buffer:
            buffer = paragraph
            continue

        if len(buffer) + len(paragraph) + 2 <= target_chars:
            buffer = f"{buffer}\n\n{paragraph}"
        else:
            flush(buffer)
            buffer = _carry_overlap(buffer, overlap_chars) + paragraph

    if buffer.strip():
        flush(buffer)

    return chunks


def _normalize(text: str) -> str:
    """Collapse runs of whitespace, normalize line endings."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_by_sentence(
    paragraph: str,
    target_chars: int,
    overlap_chars: int,
) -> list[str]:
    """Sentence-greedy split for paragraphs that exceed the absolute max."""
    sentences = _SENTENCE_END.split(paragraph)
    out: list[str] = []
    buf = ""
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if not buf:
            buf = sentence
            continue
        if len(buf) + len(sentence) + 1 <= target_chars:
            buf = f"{buf} {sentence}"
        else:
            out.append(buf)
            buf = _carry_overlap(buf, overlap_chars) + sentence
    if buf.strip():
        out.append(buf)
    return out


def _carry_overlap(text: str, overlap_chars: int) -> str:
    """Take the trailing N chars of `text` to prepend to the next chunk."""
    if overlap_chars <= 0 or len(text) <= overlap_chars:
        return ""
    tail = text[-overlap_chars:]
    # Try to align the overlap to a sentence boundary so it reads naturally.
    boundary = re.search(r"[.?!]\s+", tail)
    if boundary:
        return tail[boundary.end():] + " "
    return tail + " "


def _join(left: str, right: str) -> str:
    if not left:
        return right
    if not right:
        return left
    return f"{left}\n\n{right}"
