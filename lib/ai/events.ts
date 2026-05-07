/**
 * Streaming protocol between server (AI client) and browser.
 *
 * Event types are deliberately minimal — text deltas, citation announcements,
 * and a terminal `done`. The shape is provider-agnostic: the stub emits these
 * directly; the real Anthropic adapter will translate Claude's stream events
 * (`content_block_delta`, etc.) into this shape.
 */

export type Citation = {
  /** Stable key — G.R. number, R.A. number, article number. */
  tag: string;
  /** Human-readable title. */
  name: string;
  /** Provenance line ("2014 · 2nd Division", "Republic Act · verified"). */
  meta: string;
  status: "verified" | "unverified";
};

export type StreamEvent =
  /** Append `delta` to the current assistant turn's text. */
  | { type: "text"; delta: string }
  /** A citation has been grounded — add to the side panel. */
  | { type: "citation"; citation: Citation }
  /** Terminal event. */
  | { type: "done" }
  /** Surface a server-side error to the client. */
  | { type: "error"; message: string };

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DraftFacts = Record<string, string>;
