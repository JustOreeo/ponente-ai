# Phase 1b corpus

Hand-curated chunked Markdown for the Phase 1b MVP corpus. Each file becomes one row in `legal_documents` and N rows in `legal_chunks` (one per `## ` heading). Embedded by `npm run ingest:codes`.

## Required documents (6)

| Slug | Source | Chunk on |
|---|---|---|
| `constitution_1987` | officialgazette.gov.ph | Article + Section |
| `civil_code` | R.A. No. 386 (Official Gazette) | Article |
| `revised_penal_code` | Act No. 3815 | Article |
| `labor_code` | P.D. No. 442 (as amended) | Article |
| `nirc` | R.A. No. 8424 (as amended by R.A. No. 10963 TRAIN) | Section |
| `family_code` | E.O. No. 209 | Article |

## File format

```markdown
---
slug: civil_code
title: "Civil Code of the Philippines (R.A. No. 386)"
doc_type: code
source_url: "https://officialgazette.gov.ph/1949/06/18/republic-act-no-386/"
practice_areas: [civil, family, contracts, obligations]
effective_date: 1950-08-30
---

## Art. 1169 — Mora

Those obliged to deliver or to do something incur in delay from the time the
obligee judicially or extrajudicially demands from them the fulfillment of
their obligation.

However, the demand by the creditor shall not be necessary in order that
delay may exist:

(1) When the obligation or the law expressly so declare; ...

## Art. 1170 — Damages for Fraud, Negligence, or Delay

Those who in the performance of their obligations are guilty of fraud,
negligence, or delay, and those who in any manner contravene the tenor
thereof, are liable for damages.

## Art. 1306 — Autonomy of Contracts

The contracting parties may establish such stipulations, clauses, terms and
conditions as they may deem convenient, provided they are not contrary to
law, morals, good customs, public order, or public policy.
```

## Chunking rule

**One chunk per `## ` heading.** Don't split articles further. Keep section text complete — retrieval works best when each chunk is a self-contained legal unit.

If an article is genuinely multi-page (e.g., a long NIRC section), split it at logical sub-headings using `## Sec. 24(A) — Tax on Resident Citizens` etc. Don't split mid-paragraph.

## Frontmatter fields

| Field | Required | Notes |
|---|---|---|
| `slug` | yes | unique identifier (matches filename without `.md`) |
| `title` | yes | full citable title |
| `doc_type` | yes | one of: `constitution`, `code`, `republic_act`, `supreme_court_decision`, `executive_order`, `admin_issuance`, `local_ordinance` |
| `source_url` | recommended | link back to Official Gazette / SC e-Library |
| `practice_areas` | recommended | one or more of: `civil`, `criminal`, `labor`, `tax`, `corporate`, `family`, `election`, `constitutional`, `ip`, `admin`, `remedial`, `legal_ethics`, `mercantile` — used by the practice-area filter chip in chat |
| `effective_date` | optional | ISO date when the law took effect |

## Workflow

1. Download the canonical PDF from Official Gazette.
2. Convert to Markdown (any tool — `pdftotext`, manual cleanup).
3. Chunk by article/section (insert `## ` headings).
4. Add frontmatter.
5. Save as `corpus/<slug>.md`.
6. Run `npm run ingest:codes` (ingests all files) or `npm run ingest:codes -- <slug>` (single file).
7. Re-running re-embeds the document (slow but safe — old chunks deleted, new ones inserted).

## Quality bar

- **No OCR garbage.** Read your output. If the PDF was scanned and the text is mangled, fix it before ingesting — bad input → bad retrieval → bad answers.
- **No page numbers, footers, marginalia.** Strip them.
- **Preserve article numbering.** "Art. 1169" or "Section 24(A)" must appear verbatim — that's how the system prompt tells Claude to cite back.
- **No commentary.** Just the law.
