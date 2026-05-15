/**
 * scripts/ingest-codes.ts
 *
 * One-off ingestion of the small Phase 1b corpus: 1987 Constitution + 5
 * major Codes (Civil, Revised Penal, Labor, NIRC, Family).
 *
 * Reads chunked Markdown files from `corpus/` and upserts them as
 * legal_documents + legal_chunks rows in Supabase. Embeddings are computed
 * by Voyage AI (voyage-law-2, 1024d).
 *
 * Run:
 *   npx tsx scripts/ingest-codes.ts                # ingest all .md files in corpus/
 *   npx tsx scripts/ingest-codes.ts civil_code     # ingest one document by slug
 *
 * Each Markdown file in corpus/ must start with a YAML frontmatter block:
 *
 *   ---
 *   slug: civil_code
 *   title: "Civil Code of the Philippines (R.A. No. 386)"
 *   doc_type: code
 *   source_url: "https://officialgazette.gov.ph/..."
 *   practice_areas: [civil, family, contracts]
 *   effective_date: 1950-08-30
 *   ---
 *
 * Followed by a Markdown body where each chunk is delimited by a `## ` heading.
 * Each chunk's heading becomes its anchor (e.g., "## Art. 1169 — Mora").
 *
 * Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and VOYAGE_API_KEY
 * in .env.local before running. The script loads them via Next.js's env
 * conventions (no dotenv needed if you run via `npm run ingest:codes` which
 * shells out through next).
 */

import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database, LegalDocType } from "../lib/supabase/types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CORPUS_DIR = join(process.cwd(), "corpus");
const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const EMBEDDING_MODEL = "voyage-law-2";
const EMBEDDING_DIMS = 1024;
const EMBED_BATCH = 96; // Conservative — Voyage allows 128.

const VALID_DOC_TYPES: LegalDocType[] = [
  "constitution",
  "code",
  "republic_act",
  "supreme_court_decision",
  "executive_order",
  "admin_issuance",
  "local_ordinance",
];

// ---------------------------------------------------------------------------
// Frontmatter + chunking
// ---------------------------------------------------------------------------

type Frontmatter = {
  slug: string;
  title: string;
  doc_type: LegalDocType;
  source_url?: string;
  practice_areas?: string[];
  effective_date?: string;
};

type Chunk = {
  index: number;
  heading: string;
  text: string;
};

type ParsedDocument = {
  fm: Frontmatter;
  chunks: Chunk[];
};

function parseFrontmatter(content: string): { fm: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Document missing frontmatter (---  ... ---).");
  }
  const yaml = match[1];
  const body = match[2];

  const fm: Partial<Frontmatter> = {};
  for (const line of yaml.split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    const val = rawVal.trim();
    switch (key) {
      case "slug":
      case "title":
      case "source_url":
      case "effective_date":
        fm[key] = stripQuotes(val);
        break;
      case "doc_type":
        if (!VALID_DOC_TYPES.includes(val as LegalDocType)) {
          throw new Error(
            `Invalid doc_type "${val}" — must be one of: ${VALID_DOC_TYPES.join(", ")}`,
          );
        }
        fm.doc_type = val as LegalDocType;
        break;
      case "practice_areas":
        fm.practice_areas = parseStringArray(val);
        break;
    }
  }
  if (!fm.slug || !fm.title || !fm.doc_type) {
    throw new Error("Frontmatter requires: slug, title, doc_type.");
  }
  return { fm: fm as Frontmatter, body };
}

function stripQuotes(s: string): string {
  return s.replace(/^["']|["']$/g, "").trim();
}

function parseStringArray(s: string): string[] {
  // [a, b, c] format or comma list
  const inner = s.replace(/^\[|\]$/g, "");
  return inner
    .split(",")
    .map((x) => stripQuotes(x.trim()))
    .filter(Boolean);
}

function chunkBody(body: string): Chunk[] {
  // Split on "## " headings. Each section becomes one chunk.
  const sections = body.split(/^##\s+/m);
  const chunks: Chunk[] = [];
  let i = 0;
  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const heading = lines[0].trim();
    const text = trimmed; // include the heading in the embedded text
    chunks.push({ index: i++, heading, text });
  }
  return chunks;
}

async function loadDocument(filename: string): Promise<ParsedDocument> {
  const path = join(CORPUS_DIR, filename);
  const content = await readFile(path, "utf8");
  const { fm, body } = parseFrontmatter(content);
  const chunks = chunkBody(body);
  if (chunks.length === 0) {
    throw new Error(`${filename}: no chunks found (need ## headings).`);
  }
  return { fm, chunks };
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

type VoyageResponse = {
  data: { embedding: number[]; index: number }[];
};

async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY not set.");
  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      input_type: "document",
    }),
  });
  if (!res.ok) {
    throw new Error(
      `Voyage error ${res.status}: ${(await res.text()).slice(0, 200)}`,
    );
  }
  const json = (await res.json()) as VoyageResponse;
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ---------------------------------------------------------------------------
// Upsert
// ---------------------------------------------------------------------------

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function ingestDocument(doc: ParsedDocument): Promise<void> {
  const supabase = getSupabase();
  console.log(
    `[${doc.fm.slug}] ingesting "${doc.fm.title}" — ${doc.chunks.length} chunks`,
  );

  // 1. Upsert the document row. Match on slug stored in metadata.
  const { data: existing } = await supabase
    .from("legal_documents")
    .select("id")
    .contains("metadata", { slug: doc.fm.slug })
    .maybeSingle();

  let documentId: string;
  if (existing) {
    documentId = existing.id;
    console.log(`  → existing doc ${documentId} — replacing chunks`);
    await supabase.from("legal_chunks").delete().eq("document_id", documentId);
    await supabase
      .from("legal_documents")
      .update({
        title: doc.fm.title,
        doc_type: doc.fm.doc_type,
        source_url: doc.fm.source_url ?? null,
        practice_areas: doc.fm.practice_areas ?? [],
        effective_date: doc.fm.effective_date ?? null,
        metadata: { slug: doc.fm.slug },
      })
      .eq("id", documentId);
  } else {
    const { data: inserted, error } = await supabase
      .from("legal_documents")
      .insert({
        title: doc.fm.title,
        doc_type: doc.fm.doc_type,
        source_url: doc.fm.source_url ?? null,
        practice_areas: doc.fm.practice_areas ?? [],
        effective_date: doc.fm.effective_date ?? null,
        metadata: { slug: doc.fm.slug },
      })
      .select("id")
      .single();
    if (error || !inserted) {
      throw new Error(`Failed to insert document: ${error?.message}`);
    }
    documentId = inserted.id;
    console.log(`  → new doc ${documentId}`);
  }

  // 2. Embed in batches.
  for (let i = 0; i < doc.chunks.length; i += EMBED_BATCH) {
    const batch = doc.chunks.slice(i, i + EMBED_BATCH);
    const embeddings = await embedBatch(batch.map((c) => c.text));
    if (embeddings.length !== batch.length) {
      throw new Error(
        `Embedding count mismatch: got ${embeddings.length}, expected ${batch.length}`,
      );
    }
    for (const [j, vec] of embeddings.entries()) {
      if (vec.length !== EMBEDDING_DIMS) {
        throw new Error(
          `Embedding ${j} has wrong dim: ${vec.length} (expected ${EMBEDDING_DIMS})`,
        );
      }
    }

    const rows = batch.map((c, j) => ({
      document_id: documentId,
      chunk_index: c.index,
      text: c.text,
      embedding: embeddings[j],
      metadata: { heading: c.heading },
    }));

    const { error } = await supabase.from("legal_chunks").insert(rows);
    if (error) {
      throw new Error(`Failed to insert chunk batch at ${i}: ${error.message}`);
    }
    console.log(
      `  → embedded + upserted ${i + batch.length}/${doc.chunks.length} chunks`,
    );
  }
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

async function main() {
  const arg = process.argv[2];
  let files: string[];
  try {
    const all = await readdir(CORPUS_DIR);
    files = all.filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md");
  } catch {
    console.error(
      `corpus/ directory not found at ${CORPUS_DIR}. Create it and add .md files. See scripts/ingest-codes.ts header for format.`,
    );
    process.exit(1);
  }

  if (arg) {
    files = files.filter((f) => basename(f, ".md") === arg);
    if (files.length === 0) {
      console.error(`No corpus file matches slug "${arg}".`);
      process.exit(1);
    }
  }

  if (files.length === 0) {
    console.error("No .md files in corpus/. Nothing to ingest.");
    process.exit(1);
  }

  console.log(
    `Ingesting ${files.length} file(s): ${files.map((f) => basename(f, ".md")).join(", ")}`,
  );

  for (const file of files) {
    try {
      const doc = await loadDocument(file);
      await ingestDocument(doc);
    } catch (err) {
      console.error(
        `[${file}] FAILED: ${err instanceof Error ? err.message : err}`,
      );
      process.exitCode = 1;
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
