import "server-only";

/**
 * Voyage AI embeddings — voyage-law-2, 1024d, legal-domain-tuned.
 * Anthropic's official recommended pairing with Claude.
 *
 * https://docs.voyageai.com/docs/embeddings
 */

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-law-2";
const DIMENSIONS = 1024;

/** Voyage allows up to 128 inputs per request, max 16K tokens per input. */
const MAX_BATCH = 128;

type VoyageResponse = {
  object: string;
  data: { object: string; embedding: number[]; index: number }[];
  model: string;
  usage: { total_tokens: number };
};

type InputType = "query" | "document";

async function callVoyage(
  inputs: string[],
  inputType: InputType,
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not set.");
  }
  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: inputs,
      model: MODEL,
      input_type: inputType,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Voyage API error ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as VoyageResponse;
  // Sort by index to preserve input order (Voyage usually returns in order, but be defensive).
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** Embed a user query. Returns a single 1024d vector. */
export async function embedQuery(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("embedQuery: empty input");
  const [vector] = await callVoyage([trimmed], "query");
  if (!vector || vector.length !== DIMENSIONS) {
    throw new Error(
      `embedQuery: expected ${DIMENSIONS}d vector, got ${vector?.length}`,
    );
  }
  return vector;
}

/**
 * Embed a batch of document chunks. Splits into ≤128-input requests.
 * Returns vectors in the same order as inputs.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  const filtered = texts.map((t) => t.trim()).filter((t) => t.length > 0);
  if (filtered.length === 0) return [];

  const out: number[][] = [];
  for (let i = 0; i < filtered.length; i += MAX_BATCH) {
    const batch = filtered.slice(i, i + MAX_BATCH);
    const vectors = await callVoyage(batch, "document");
    out.push(...vectors);
  }
  return out;
}

export const EMBEDDING_DIMENSIONS = DIMENSIONS;
export const EMBEDDING_MODEL = MODEL;
