import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedQuery } from "./embed";
import {
  PH_LEGAL_SYSTEM_PROMPT,
  PH_DRAFTING_SYSTEM_PROMPT,
  buildRetrievalContext,
} from "./prompts";
import type { AIClient, ChatOptions } from "./client";
import type {
  ChatMessage,
  Citation,
  DraftFacts,
  StreamEvent,
} from "./events";
import type { Database } from "@/lib/supabase/types";

/**
 * Real Anthropic Claude adapter. Replaces the stub once ANTHROPIC_API_KEY,
 * VOYAGE_API_KEY, and SUPABASE_SERVICE_ROLE_KEY are configured.
 *
 * Pipeline:
 *   user query
 *     → embed via Voyage (voyage-law-2)
 *     → match_legal_chunks RPC for top-k retrieval
 *     → Claude messages.stream with system prompt + retrieved context
 *     → translate Claude's stream events to our StreamEvent shape
 *     → detect [[citation]] markers in output and emit citation events
 */

const CHAT_MODEL = "claude-sonnet-4-6";
const DRAFT_MODEL = "claude-sonnet-4-6"; // Bump to opus once we ship paid drafting.
const MAX_OUTPUT_TOKENS_CHAT = 2048;
const MAX_OUTPUT_TOKENS_DRAFT = 4096;
const RETRIEVAL_TOP_K = 25;

type RetrievedChunk =
  Database["public"]["Functions"]["match_legal_chunks"]["Returns"][number];

function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  return new Anthropic({ apiKey });
}

async function retrieve(
  query: string,
  practiceAreas?: string[],
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(query);
  const supabase = createAdminClient();
  // Cast to bypass Supabase's strict rpc inference (the auto-generated types
  // for our pgvector/text[] args don't fully line up with the `Args` shape
  // postgrest-js expects). Runtime payload is correct; types are checked by
  // the SQL migration.
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: "match_legal_chunks",
      args: {
        query_embedding: number[];
        match_count?: number;
        practice_area_filter?: string[] | null;
      },
    ) => Promise<{ data: RetrievedChunk[] | null; error: { message: string } | null }>
  )("match_legal_chunks", {
    query_embedding: queryEmbedding,
    match_count: RETRIEVAL_TOP_K,
    practice_area_filter:
      practiceAreas && practiceAreas.length > 0 ? practiceAreas : null,
  });
  if (error) {
    throw new Error(`Retrieval failed: ${error.message}`);
  }
  return data ?? [];
}

/**
 * Build a Citation from a retrieved chunk's parent doc metadata.
 * Used when we detect a citation marker in Claude's output and need to
 * surface the full source info to the side panel.
 */
function chunkToCitation(chunk: RetrievedChunk, tag: string): Citation {
  const meta: string[] = [];
  if (chunk.doc_type === "supreme_court_decision") {
    if (chunk.effective_date) {
      meta.push(new Date(chunk.effective_date).getFullYear().toString());
    }
    const division = (chunk.doc_metadata as { division?: string })?.division;
    if (division) meta.push(division);
  } else if (chunk.doc_type === "republic_act") {
    meta.push("Republic Act");
  } else if (chunk.doc_type === "code") {
    meta.push("Code");
  } else if (chunk.doc_type === "constitution") {
    meta.push("Constitution");
  } else {
    meta.push(chunk.doc_type.replace(/_/g, " "));
  }
  meta.push("verified");
  return {
    tag,
    name: chunk.doc_title,
    meta: meta.join(" · "),
    status: "verified",
  };
}

/**
 * Scan a freshly-emitted text delta for [[tag]] markers. For each marker,
 * try to match it to a retrieved chunk's source doc and yield a citation
 * event. Returns the set of tags already emitted so callers don't double-fire.
 */
function detectCitationsInBuffer(
  buffer: string,
  chunks: RetrievedChunk[],
  alreadyEmitted: Set<string>,
): Citation[] {
  const out: Citation[] = [];
  const regex = /\[\[([^\]]+?)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(buffer)) !== null) {
    const tag = match[1].trim();
    if (alreadyEmitted.has(tag)) continue;
    alreadyEmitted.add(tag);

    // Try to find a chunk whose document title or metadata mentions this tag.
    // Heuristic: split the tag into recognizable tokens and look for them
    // in the chunk text or doc title.
    const matched = findMatchingChunk(tag, chunks);
    if (matched) {
      out.push(chunkToCitation(matched, tag));
    } else {
      // No retrieved chunk matches — flag as unverified so the UI can warn.
      out.push({
        tag,
        name: "Source not in retrieved corpus",
        meta: "unverified",
        status: "unverified",
      });
    }
  }
  return out;
}

/**
 * Heuristic chunk lookup. Looks for the citation tag (e.g., "G.R. No. 196444"
 * or "Art. 1169, Civil Code") inside the chunk text or document title of
 * any retrieved chunk. Returns the first match.
 */
function findMatchingChunk(
  tag: string,
  chunks: RetrievedChunk[],
): RetrievedChunk | null {
  const tagLower = tag.toLowerCase();
  // First pass: exact substring match in chunk text
  for (const c of chunks) {
    if (c.chunk_text.toLowerCase().includes(tagLower)) return c;
  }
  // Second pass: exact substring match in doc title
  for (const c of chunks) {
    if (c.doc_title.toLowerCase().includes(tagLower)) return c;
  }
  // Third pass: G.R. No. extracted match
  const grMatch = tag.match(/G\.R\.\s*No\.\s*(\d+)/i);
  if (grMatch) {
    const grNum = grMatch[1];
    for (const c of chunks) {
      if (c.chunk_text.includes(grNum) || c.doc_title.includes(grNum)) return c;
    }
  }
  // Fourth pass: R.A. No. extracted match
  const raMatch = tag.match(/R\.A\.\s*No\.\s*(\d+)/i);
  if (raMatch) {
    const raNum = raMatch[1];
    for (const c of chunks) {
      if (c.chunk_text.includes(raNum) || c.doc_title.includes(raNum)) return c;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// CHAT
// ---------------------------------------------------------------------------

async function* anthropicChat(
  messages: ChatMessage[],
  options?: ChatOptions,
): AsyncIterable<StreamEvent> {
  if (messages.length === 0) {
    yield { type: "error", message: "No messages provided." };
    return;
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    yield { type: "error", message: "No user message found." };
    return;
  }

  let chunks: RetrievedChunk[] = [];
  try {
    chunks = await retrieve(lastUser.content, options?.practiceAreas);
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Retrieval error.",
    };
    return;
  }

  const contextBlock = buildRetrievalContext(chunks);
  const anthropic = getAnthropic();

  // Build the message history for Claude. Prepend the retrieval context to
  // the latest user message so it's always adjacent to the question.
  const claudeMessages = messages.map((m, i) => {
    const isLatestUser = i === messages.length - 1 && m.role === "user";
    return {
      role: m.role,
      content: isLatestUser ? `${contextBlock}\n\n${m.content}` : m.content,
    };
  });

  const emittedTags = new Set<string>();
  let bufferSinceLastScan = "";

  try {
    const stream = anthropic.messages.stream({
      model: CHAT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS_CHAT,
      system: PH_LEGAL_SYSTEM_PROMPT,
      messages: claudeMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const delta = event.delta.text;
        yield { type: "text", delta };
        bufferSinceLastScan += delta;

        // Only scan when we likely have a complete marker — i.e., when buffer
        // contains a closing `]]`. Otherwise wait for more deltas.
        if (bufferSinceLastScan.includes("]]")) {
          const newCitations = detectCitationsInBuffer(
            bufferSinceLastScan,
            chunks,
            emittedTags,
          );
          for (const c of newCitations) {
            yield { type: "citation", citation: c };
          }
          // Keep the tail after the last `]]` in case a partial marker is open.
          const lastClose = bufferSinceLastScan.lastIndexOf("]]");
          bufferSinceLastScan = bufferSinceLastScan.slice(lastClose + 2);
        }
      }
    }
    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Claude stream error.",
    };
  }
}

// ---------------------------------------------------------------------------
// DRAFT
// ---------------------------------------------------------------------------

const TEMPLATE_NAMES: Record<string, string> = {
  demand: "Demand Letter",
  affidavit: "Affidavit of Loss",
  nlrc: "NLRC Position Paper",
  mr: "Motion for Reconsideration",
  petition: "Verified Petition",
};

function buildDraftPrompt(template: string, facts: DraftFacts): string {
  const templateName = TEMPLATE_NAMES[template] ?? "Demand Letter";
  const factsList = Object.entries(facts)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  return `Draft a **${templateName}** using the following facts:\n\n${factsList || "(no facts provided — use placeholders the user can fill in)"}\n\nProduce the document body only.`;
}

async function* anthropicDraft(
  template: string,
  facts: DraftFacts,
): AsyncIterable<StreamEvent> {
  const userMsg = buildDraftPrompt(template, facts);

  // Retrieve based on the template name + user-supplied "obligation" / "claim"
  // field (whichever is most likely to anchor relevant authorities). Falls
  // back to the template name if no facts.
  const retrievalQuery = [
    TEMPLATE_NAMES[template] ?? template,
    facts.obligation || facts.claim || facts.subject || "",
  ]
    .filter(Boolean)
    .join(" ");

  let chunks: RetrievedChunk[] = [];
  try {
    chunks = await retrieve(retrievalQuery);
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Retrieval error.",
    };
    return;
  }

  const contextBlock = buildRetrievalContext(chunks);
  const anthropic = getAnthropic();

  const emittedTags = new Set<string>();
  let bufferSinceLastScan = "";

  try {
    const stream = anthropic.messages.stream({
      model: DRAFT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS_DRAFT,
      system: PH_DRAFTING_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${contextBlock}\n\n${userMsg}`,
        },
      ],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        const delta = event.delta.text;
        yield { type: "text", delta };
        bufferSinceLastScan += delta;
        if (bufferSinceLastScan.includes("]]")) {
          const newCitations = detectCitationsInBuffer(
            bufferSinceLastScan,
            chunks,
            emittedTags,
          );
          for (const c of newCitations) {
            yield { type: "citation", citation: c };
          }
          const lastClose = bufferSinceLastScan.lastIndexOf("]]");
          bufferSinceLastScan = bufferSinceLastScan.slice(lastClose + 2);
        }
      }
    }
    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      message: err instanceof Error ? err.message : "Claude stream error.",
    };
  }
}

export const anthropicClient: AIClient = {
  chat: anthropicChat,
  draft: anthropicDraft,
};
