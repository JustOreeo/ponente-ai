import "server-only";
import type { ChatMessage, DraftFacts, StreamEvent } from "./events";
import { stubChat, stubDraft } from "./stub";

/**
 * AI client interface. The stub implementation lives in stub.ts; once
 * Anthropic creds are wired, swap in a real adapter that translates Claude's
 * stream events into our StreamEvent shape.
 */
export interface AIClient {
  chat(messages: ChatMessage[]): AsyncIterable<StreamEvent>;
  draft(template: string, facts: DraftFacts): AsyncIterable<StreamEvent>;
}

const STUB: AIClient = {
  chat: stubChat,
  draft: stubDraft,
};

/**
 * Returns the configured AI client. Reads `ANTHROPIC_API_KEY` to decide:
 * if absent, returns the stub. Phase 1b will add the real Anthropic adapter
 * here.
 */
export function getAIClient(): AIClient {
  // Real Anthropic adapter wires in later — Phase 1b/2.
  // For now everything routes through the stub.
  return STUB;
}
