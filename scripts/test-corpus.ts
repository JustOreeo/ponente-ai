/**
 * scripts/test-corpus.ts
 *
 * Run the 100-query test corpus against a live /api/chat endpoint and
 * record the answers + citations for lawyer grading.
 *
 * Usage:
 *   # Default: hits http://localhost:3000 (start `npm run dev` first)
 *   npx tsx scripts/test-corpus.ts
 *
 *   # Hit a deployed instance
 *   PONENTE_BASE_URL=https://ponente.ph npx tsx scripts/test-corpus.ts
 *
 *   # Run only a subset (filter by practice area)
 *   PONENTE_TEST_AREA=labor npx tsx scripts/test-corpus.ts
 *
 *   # Limit query count
 *   PONENTE_TEST_LIMIT=10 npx tsx scripts/test-corpus.ts
 *
 * Requires the dev server (or remote) to have a real Anthropic + Voyage +
 * Supabase setup. With the stub AI client the answers will be canned; the
 * runner still captures them so you can see the shape.
 *
 * The run produces tests/corpus-runs/<ISO-timestamp>.jsonl with one line per
 * query: { id, q, practice_area, expected_*, answer, citations, latency_ms }.
 * Hand-grade by opening that file alongside tests/corpus-queries.json.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

type Query = {
  id: string;
  practice_area: string;
  q: string;
  expected_concepts?: string[];
  expected_citations?: string[];
  must_not_hallucinate?: string[];
};

type CorpusFile = {
  version: number;
  created: string;
  notes: string;
  queries: Query[];
};

type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "citation"; citation: { tag: string; name: string; meta: string; status: "verified" | "unverified" } }
  | { type: "done" }
  | { type: "error"; message: string };

const BASE_URL = process.env.PONENTE_BASE_URL || "http://localhost:3000";
const FILTER_AREA = process.env.PONENTE_TEST_AREA;
const LIMIT = process.env.PONENTE_TEST_LIMIT
  ? Number(process.env.PONENTE_TEST_LIMIT)
  : Infinity;

async function main() {
  const corpusPath = join(process.cwd(), "tests/corpus-queries.json");
  const raw = await readFile(corpusPath, "utf8");
  const corpus = JSON.parse(raw) as CorpusFile;

  let queries = corpus.queries;
  if (FILTER_AREA) queries = queries.filter((q) => q.practice_area === FILTER_AREA);
  if (Number.isFinite(LIMIT)) queries = queries.slice(0, LIMIT);

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(process.cwd(), `tests/corpus-runs/${ts}.jsonl`);
  await mkdir(dirname(outPath), { recursive: true });

  console.log(
    `Running ${queries.length} query/queries against ${BASE_URL} → ${outPath}`,
  );

  let ok = 0;
  let failed = 0;

  for (const q of queries) {
    const started = Date.now();
    try {
      const result = await runOne(q);
      const latency = Date.now() - started;
      const record = {
        id: q.id,
        q: q.q,
        practice_area: q.practice_area,
        expected_concepts: q.expected_concepts ?? [],
        expected_citations: q.expected_citations ?? [],
        must_not_hallucinate: q.must_not_hallucinate ?? [],
        answer: result.answer,
        citations: result.citations,
        citation_tags: result.citations.map((c) => c.tag),
        latency_ms: latency,
        ran_at: new Date().toISOString(),
      };
      await appendJsonl(outPath, record);
      ok++;
      console.log(
        `  ✓ ${q.id} (${latency}ms, ${result.citations.length} citations)`,
      );
    } catch (err) {
      const latency = Date.now() - started;
      const record = {
        id: q.id,
        q: q.q,
        practice_area: q.practice_area,
        error: err instanceof Error ? err.message : String(err),
        latency_ms: latency,
        ran_at: new Date().toISOString(),
      };
      await appendJsonl(outPath, record);
      failed++;
      console.log(`  ✗ ${q.id} — ${record.error}`);
    }
  }

  console.log(`\nDone. ${ok} ok, ${failed} failed. → ${outPath}`);
}

async function runOne(q: Query): Promise<{
  answer: string;
  citations: { tag: string; name: string; meta: string; status: "verified" | "unverified" }[];
}> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: q.q }],
      practiceAreas: [q.practice_area],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  if (!res.body) throw new Error("no response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  const citations: {
    tag: string;
    name: string;
    meta: string;
    status: "verified" | "unverified";
  }[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const line = chunk
        .split("\n")
        .find((l) => l.startsWith("data:"))
        ?.slice(5)
        .trim();
      if (!line) continue;
      const event = JSON.parse(line) as StreamEvent;
      if (event.type === "text") answer += event.delta;
      else if (event.type === "citation") citations.push(event.citation);
      else if (event.type === "error") throw new Error(event.message);
    }
  }

  return { answer, citations };
}

async function appendJsonl(path: string, record: object): Promise<void> {
  await writeFile(path, JSON.stringify(record) + "\n", { flag: "a" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
