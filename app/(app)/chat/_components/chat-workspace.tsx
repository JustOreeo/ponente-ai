"use client";

import { useEffect, useRef, useState } from "react";
import { renderWithCitations } from "@/components/citation-rendered";
import { readEvents } from "@/lib/ai/stream";
import { PaywallModal } from "@/components/ui/paywall-modal";
import { PRACTICE_AREAS } from "@/lib/draft/practice-areas";
import type { Citation } from "@/lib/ai/events";

type Msg = {
  id: string;
  role: "user" | "assistant";
  ts: string;
  body: string;
  tagalog?: { open: boolean; body: string; pending: boolean; error?: string };
};

type Props = {
  /** When set, the workspace is editing this existing chat. */
  initialChatId?: string;
  initialThread?: Msg[];
  initialSources?: Citation[];
};

export function ChatWorkspace({
  initialChatId,
  initialThread,
  initialSources,
}: Props = {}) {
  const [chatId, setChatId] = useState<string | null>(initialChatId ?? null);
  const [thread, setThread] = useState<Msg[]>(initialThread ?? []);
  const [sources, setSources] = useState<Citation[]>(initialSources ?? []);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<Citation | null>(null);
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [paywall, setPaywall] = useState<
    | { open: false }
    | { open: true; used?: number; limit?: number | "unlimited" }
  >({ open: false });
  const threadRef = useRef<HTMLDivElement>(null);

  // Map tag → Citation for fast lookup when rendering pills.
  const citationMap = new Map<string, Citation>();
  for (const s of sources) citationMap.set(s.tag, s);

  function openSource(citation: Citation) {
    setActiveSource(citation);
    setSources((prev) =>
      prev.some((s) => s.tag === citation.tag) ? prev : [...prev, citation],
    );
  }

  function toggleFilter(slug: string) {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function patchMsg(id: string, patch: Partial<Msg>) {
    setThread((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function patchTagalog(id: string, patch: Partial<NonNullable<Msg["tagalog"]>>) {
    setThread((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              tagalog: { open: true, body: "", pending: false, ...m.tagalog, ...patch },
            }
          : m,
      ),
    );
  }

  async function explainTagalog(messageId: string, sourceText: string) {
    if (!sourceText.trim()) return;
    const existing = thread.find((m) => m.id === messageId)?.tagalog;
    if (existing?.pending) return;

    if (existing && existing.body && !existing.pending) {
      patchMsg(messageId, { tagalog: { ...existing, open: !existing.open } });
      return;
    }

    patchTagalog(messageId, { body: "", pending: true, error: undefined });

    try {
      const res = await fetch("/api/chat/explain-tagalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      for await (const event of readEvents(res)) {
        if (event.type === "text") {
          setThread((prev) =>
            prev.map((m) =>
              m.id === messageId && m.tagalog
                ? { ...m, tagalog: { ...m.tagalog, body: m.tagalog.body + event.delta } }
                : m,
            ),
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    } catch (err) {
      patchTagalog(messageId, {
        pending: false,
        error: err instanceof Error ? err.message : "Translation failed.",
      });
      return;
    }
    patchTagalog(messageId, { pending: false });
  }

  // Auto-scroll thread to bottom when new content arrives.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [thread]);

  /**
   * Ensure a chat row exists. If we don't have a chatId yet, create one and
   * patch the URL to /chat/<id> so refresh/back work.
   */
  async function ensureChat(seedTitle: string): Promise<string | null> {
    if (chatId) return chatId;
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: seedTitle.slice(0, 80),
          practiceAreas: Array.from(filters),
        }),
      });
      if (!res.ok) return null; // Silent — chat still works in-memory
      const json = await res.json();
      const id = json?.chat?.id as string | undefined;
      if (!id) return null;
      setChatId(id);
      // Update URL without triggering a Next route push.
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `/chat/${id}`);
      }
      return id;
    } catch {
      return null;
    }
  }

  async function persistMessages(
    targetChatId: string,
    userBody: string,
    assistantBody: string,
    citationsForAssistant: Citation[],
  ): Promise<void> {
    // Best-effort writes; ignore failures (chat continues to work in memory).
    try {
      await fetch(`/api/chats/${targetChatId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: "user", body: userBody, citations: [] }),
      });
      await fetch(`/api/chats/${targetChatId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role: "assistant",
          body: assistantBody,
          citations: citationsForAssistant,
        }),
      });
    } catch {
      // Swallow — chat still works in memory.
    }
  }

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    const ts = nowHHMM();
    const userMsg: Msg = { id: `u-${Date.now()}`, role: "user", ts, body: trimmed };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: Msg = { id: assistantId, role: "assistant", ts, body: "" };

    setThread((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setPending(true);
    setError(null);

    // Track citations seen during this turn so we can persist them with the
    // assistant message. Existing side-panel sources include prior turns too.
    const turnCitations: Citation[] = [];
    let assistantBody = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...thread.map((m) => ({ role: m.role, content: m.body })),
            { role: "user", content: trimmed },
          ],
          practiceAreas: Array.from(filters),
        }),
      });
      if (res.status === 429) {
        const json = await res.json().catch(() => ({}));
        setPaywall({ open: true, used: json.used, limit: json.limit });
        setThread((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      for await (const event of readEvents(res)) {
        if (event.type === "text") {
          assistantBody += event.delta;
          setThread((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, body: m.body + event.delta } : m,
            ),
          );
        } else if (event.type === "citation") {
          const citation = event.citation;
          turnCitations.push(citation);
          setSources((prev) =>
            prev.some((s) => s.tag === citation.tag) ? prev : [...prev, citation],
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }

      // Stream complete — persist to DB if user is signed in.
      const targetChatId = await ensureChat(trimmed);
      if (targetChatId) {
        await persistMessages(targetChatId, trimmed, assistantBody, turnCitations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stream error.");
    } finally {
      setPending(false);
    }
  }

  const isEmpty = thread.length === 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] flex-1 min-h-0">
      {/* Thread + composer */}
      <div className="flex flex-col lg:border-r lg:border-line min-h-0">
        <div
          ref={threadRef}
          className="flex-1 overflow-auto px-5 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8"
        >
          <div className="max-w-[720px]">
            {isEmpty ? (
              <EmptyThread />
            ) : (
              thread.map((m) => (
                <div key={m.id} className="mb-8">
                  <div
                    className="font-mono text-[10.5px] tracking-[0.14em] uppercase mb-2"
                    style={{
                      color:
                        m.role === "assistant"
                          ? "var(--color-accent)"
                          : "var(--color-muted)",
                    }}
                  >
                    {m.role === "assistant" ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-[6px] h-[6px] rounded-full bg-accent" />
                        Ponente · {m.ts}
                      </span>
                    ) : (
                      <>You · {m.ts}</>
                    )}
                  </div>
                  <div
                    className={
                      m.role === "assistant"
                        ? "font-serif text-[15.5px] text-ink leading-[1.65]"
                        : "font-sans text-[14.5px] text-ink leading-[1.55]"
                    }
                  >
                    {m.role === "assistant" ? (
                      m.body ? (
                        renderWithCitations(m.body, citationMap, openSource)
                      ) : (
                        <PendingDots />
                      )
                    ) : (
                      <p className="m-0">{m.body}</p>
                    )}
                  </div>

                  {/* Tagalog explainer — only on completed assistant messages */}
                  {m.role === "assistant" && m.body && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => explainTagalog(m.id, m.body)}
                        disabled={m.tagalog?.pending}
                        className="font-mono text-[10.5px] tracking-[0.04em] text-muted hover:text-ink border border-line px-2 py-[3px] rounded-[2px] bg-transparent cursor-pointer disabled:opacity-60 transition-colors"
                      >
                        {m.tagalog?.pending
                          ? "Translating…"
                          : m.tagalog?.body
                            ? m.tagalog.open
                              ? "Hide Tagalog"
                              : "Show Tagalog"
                            : "Explain in Tagalog"}
                      </button>
                      {m.tagalog?.open && (
                        <div className="mt-3 border-l-2 border-gold pl-4 py-1">
                          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-gold mb-2">
                            Tagalog
                          </div>
                          {m.tagalog.body ? (
                            <div className="font-serif text-[14.5px] text-ink-soft leading-[1.65]">
                              {renderWithCitations(
                                m.tagalog.body,
                                citationMap,
                                openSource,
                              )}
                            </div>
                          ) : (
                            <PendingDots />
                          )}
                          {m.tagalog.error && (
                            <div className="text-[12px] text-accent mt-2">
                              {m.tagalog.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            {error && (
              <div className="text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45] mb-4">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-line bg-surface px-5 py-4 sm:px-8 sm:py-5 lg:px-10">
          <form
            className="max-w-[720px]"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            {/* Practice-area filter chips */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mr-1">
                Practice
              </span>
              {PRACTICE_AREAS.map((p) => {
                const active = filters.has(p.slug);
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => toggleFilter(p.slug)}
                    className={`font-mono text-[10.5px] tracking-[0.04em] px-2 py-[2px] border rounded-[999px] cursor-pointer transition-colors ${
                      active
                        ? "bg-ink text-parchment border-ink"
                        : "bg-transparent text-ink-soft border-line hover:border-ink"
                    }`}
                    aria-pressed={active}
                  >
                    {p.label}
                  </button>
                );
              })}
              {filters.size > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters(new Set())}
                  className="font-mono text-[10px] text-muted hover:text-accent ml-1 bg-transparent border-0 cursor-pointer"
                >
                  clear
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 bg-parchment border border-line rounded-[2px] px-4 py-[10px] focus-within:border-ink transition-colors">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about Philippine law…"
                disabled={pending}
                className="flex-1 bg-transparent border-0 font-sans text-[14px] text-ink focus:outline-none disabled:opacity-60"
                autoFocus
              />
              <button
                type="submit"
                disabled={!input.trim() || pending}
                className="font-mono text-[10px] text-muted tracking-[0.04em] border border-line px-[5px] py-[1px] rounded-[2px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 bg-transparent"
              >
                {pending ? "…" : "↵"}
              </button>
            </div>
            <p className="text-[11px] text-muted italic mt-3 m-0">
              Verify with the source decision before relying on this in
              pleadings.
            </p>
          </form>
        </div>
      </div>

      {/* Citation panel — stacks below thread on mobile, side panel on desktop */}
      <aside className="bg-surface px-5 py-6 overflow-auto border-t border-line lg:border-t-0">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          Sources · {sources.filter((s) => s.status === "verified").length} verified
          {sources.some((s) => s.status === "unverified") &&
            ` · ${sources.filter((s) => s.status === "unverified").length} unverified`}
        </div>
        {sources.length === 0 ? (
          <p className="text-[11.5px] text-muted italic m-0">
            Sources appear as Ponente cites them.
          </p>
        ) : (
          sources.map((s) => {
            const isUnverified = s.status === "unverified";
            const isActive = activeSource?.tag === s.tag;
            return (
              <button
                key={s.tag}
                type="button"
                onClick={() => setActiveSource(s)}
                className={`block w-full text-left border-t py-3 appearance-none bg-transparent border-l-0 border-r-0 border-b-0 ${isActive ? "border-accent" : "border-line-soft"} cursor-pointer hover:bg-parchment/40 transition-colors`}
              >
                <div
                  className={`inline-flex items-center gap-[5px] bg-surface-alt border ${isUnverified ? "border-dashed border-muted" : "border-line"} px-2 py-[1px] font-mono text-[10.5px] text-ink mb-[6px]`}
                >
                  <span
                    className={`w-1 h-1 rounded-full ${isUnverified ? "bg-muted" : "bg-accent"}`}
                  />
                  {s.tag}
                </div>
                <div className="font-serif italic text-[13px] text-ink leading-[1.4]">
                  {s.name}
                </div>
                <div
                  className={`text-[10.5px] font-mono mt-[2px] ${isUnverified ? "text-accent" : "text-muted"}`}
                >
                  {s.meta}
                </div>
              </button>
            );
          })
        )}
        {sources.length > 0 && (
          <p className="mt-6 text-[11.5px] text-muted leading-[1.5]">
            Click a source to open the full decision. Dashed pills mark
            citations not grounded in the corpus — verify before using.
          </p>
        )}
      </aside>

      <PaywallModal
        open={paywall.open}
        onClose={() => setPaywall({ open: false })}
        type="qa"
        used={paywall.open ? paywall.used : undefined}
        limit={paywall.open ? paywall.limit : undefined}
      />
    </div>
  );
}

function EmptyThread() {
  const EXAMPLES = [
    "Can a residential lessor collect rent in advance for the entire term?",
    "What's the test for illegal dismissal in the Philippines?",
    "When can an employer suspend an employee without pay?",
    "How is interest computed on a loan after demand?",
  ];
  return (
    <div className="py-6 sm:py-10">
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
        New thread
      </div>
      <h1
        className="font-serif text-[28px] sm:text-[32px] font-normal m-0 mb-3"
        style={{ letterSpacing: "-0.018em", lineHeight: 1.1 }}
      >
        Ask Ponente anything about Philippine law.
      </h1>
      <p className="text-[14px] text-ink-soft m-0 mb-6 leading-[1.55] max-w-[560px]">
        Every answer comes with verified Supreme Court decisions, Republic
        Acts, and constitutional provisions — counted and clickable.
      </p>
      <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-2">
        Try
      </div>
      <ul className="m-0 p-0 list-none">
        {EXAMPLES.map((e) => (
          <li
            key={e}
            className="font-serif text-[14.5px] text-ink-soft py-1.5 leading-[1.5]"
          >
            <span className="text-accent mr-2">·</span>
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PendingDots() {
  return (
    <span className="inline-flex gap-1 text-muted">
      <Dot delay="0ms" />
      <Dot delay="120ms" />
      <Dot delay="240ms" />
    </span>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block w-[6px] h-[6px] rounded-full bg-muted animate-pulse"
      style={{ animationDelay: delay }}
    />
  );
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
