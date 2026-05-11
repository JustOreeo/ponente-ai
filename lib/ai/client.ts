import "server-only";
import type { ChatMessage, DraftFacts, StreamEvent } from "./events";
import { stubChat, stubDraft } from "./stub";

export type ChatOptions = {
  /** Optional practice-area filter. When set, retrieval is intersected. */
  practiceAreas?: string[];
};

/**
 * AI client interface. The stub implementation lives in stub.ts; the real
 * Anthropic + Voyage + pgvector pipeline lives in anthropic.ts. The factory
 * below picks which one based on whether all required keys are configured.
 */
export interface AIClient {
  chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncIterable<StreamEvent>;
  draft(template: string, facts: DraftFacts): AsyncIterable<StreamEvent>;
}

const STUB: AIClient = {
  chat: stubChat,
  draft: stubDraft,
};

let cachedRealClient: AIClient | null = null;

function hasRealKeys(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY &&
      process.env.VOYAGE_API_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

/**
 * Returns the configured AI client.
 *
 * If all required keys are present (Anthropic + Voyage + Supabase service
 * role + Supabase URL), returns the real Claude-backed adapter that retrieves
 * over pgvector. Otherwise falls back to the stub so dev iteration on the UI
 * still works without secrets.
 */
export function getAIClient(): AIClient {
  if (!hasRealKeys()) return STUB;
  if (cachedRealClient) return cachedRealClient;
  // Lazy-load to avoid pulling the Anthropic SDK + Supabase admin client into
  // the bundle when the stub is sufficient.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { anthropicClient } = require("./anthropic") as {
    anthropicClient: AIClient;
  };
  cachedRealClient = anthropicClient;
  return anthropicClient;
}
