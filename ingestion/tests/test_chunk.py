"""Unit tests for the chunker — runs without API keys or network."""

from __future__ import annotations

from ingestion.chunk import chunk_decision


def test_empty_text_returns_no_chunks() -> None:
    assert chunk_decision("") == []
    assert chunk_decision("   \n\n  \t  ") == []


def test_short_text_one_chunk() -> None:
    text = "This is a short decision. It should fit in one chunk."
    chunks = chunk_decision(text)
    assert len(chunks) == 1
    assert chunks[0].text == text
    assert chunks[0].index == 0


def test_long_text_multiple_chunks() -> None:
    paragraph = " ".join([f"This is sentence {i} of a long decision." for i in range(80)])
    text = "\n\n".join([paragraph] * 4)
    chunks = chunk_decision(text, target_chars=1500)
    assert len(chunks) >= 2
    assert all(len(c.text) <= 2400 for c in chunks)


def test_paragraph_boundary_preserved() -> None:
    text = "First paragraph here.\n\nSecond paragraph here.\n\nThird one."
    chunks = chunk_decision(text, target_chars=1500)
    assert len(chunks) == 1
    # All paragraphs preserved in the single chunk.
    assert "First paragraph" in chunks[0].text
    assert "Second paragraph" in chunks[0].text
    assert "Third one" in chunks[0].text


def test_giant_paragraph_sentence_split() -> None:
    sentence = "This is a long sentence used to fill space, so we exceed the per-chunk target. "
    text = sentence * 60  # ~5400 chars
    chunks = chunk_decision(text, target_chars=1500)
    assert len(chunks) >= 3
    assert all(c.text for c in chunks)


def test_chunk_indices_sequential() -> None:
    paragraph = "para. " * 400
    text = "\n\n".join([paragraph] * 3)
    chunks = chunk_decision(text)
    indices = [c.index for c in chunks]
    assert indices == list(range(len(chunks)))


def test_normalizes_crlf_line_endings() -> None:
    text = "Para one.\r\n\r\nPara two."
    chunks = chunk_decision(text)
    assert len(chunks) == 1
    # \r should be stripped during normalization.
    assert "\r" not in chunks[0].text
