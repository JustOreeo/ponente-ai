"use client";

import { useEffect, useRef, useState } from "react";
import { renderWithCitations } from "@/components/citation-rendered";
import { readEvents } from "@/lib/ai/stream";
import type { Citation } from "@/lib/ai/events";

type Msg = {
  id: string;
  role: "user" | "assistant";
  ts: string;
  body: string;
};

const INITIAL_THREAD: Msg[] = [
  {
    id: "u1",
    role: "user",
    ts: "14:01",
    body: "Can a residential lessor collect rent in advance for the entire term, or is that prohibited by law?",
  },
  {
    id: "a1",
    role: "assistant",
    ts: "14:01",
    body:
      "For residential leases, advance rent is regulated. Under [[R.A. No. 9653]] (the Rent Control Act of 2009, as extended), lessors of covered units may demand no more than **one (1) month advance rent** and **two (2) months security deposit** at the start of the lease.\n\nOutside the Rent Control Act's coverage (units exceeding the monthly cap), the parties may stipulate freely under [[Art. 1306, Civil Code]] — but the terms still cannot run contrary to law, morals, or public order.\n\nThe Court has applied this distinction consistently — see [[G.R. No. 196444]] *Solid Homes v. Spouses Tan* (2014), where rent demandability under Art. 1169 was anchored to the agreed term.",
  },
];

const INITIAL_SOURCES: Citation[] = [
  {
    tag: "R.A. No. 9653",
    name: "Rent Control Act of 2009",
    meta: "Republic Act · verified",
    status: "verified",
  },
  {
    tag: "Art. 1306, Civil Code",
    name: "Civil Code of the Philippines",
    meta: "Republic Act · verified",
    status: "verified",
  },
  {
    tag: "G.R. No. 196444",
    name: "Solid Homes v. Spouses Tan",
    meta: "2014 · 2nd Division",
    status: "verified",
  },
];

export function ChatWorkspace() {
  const [thread, setThread] = useState<Msg[]>(INITIAL_THREAD);
  const [sources, setSources] = useState<Citation[]>(INITIAL_SOURCES);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<Citation | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Map tag → Citation for fast lookup when rendering pills.
  const citationMap = new Map<string, Citation>();
  for (const s of sources) citationMap.set(s.tag, s);

  function openSource(citation: Citation) {
    setActiveSource(citation);
    // Add to side panel if not already there.
    setSources((prev) =>
      prev.some((s) => s.tag === citation.tag) ? prev : [...prev, citation],
    );
  }

  // Auto-scroll thread to bottom when new content arrives.
  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [thread]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    const ts = nowHHMM();
    const userMsg: Msg = {
      id: `u-${Date.now()}`,
      role: "user",
      ts,
      body: trimmed,
    };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: Msg = {
      id: assistantId,
      role: "assistant",
      ts,
      body: "",
    };

    setThread((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...thread.map((m) => ({ role: m.role, content: m.body })),
            { role: "user", content: trimmed },
          ],
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      for await (const event of readEvents(res)) {
        if (event.type === "text") {
          setThread((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, body: m.body + event.delta }
                : m,
            ),
          );
        } else if (event.type === "citation") {
          const citation = event.citation;
          setSources((prev) =>
            prev.some((s) => s.tag === citation.tag)
              ? prev
              : [...prev, citation],
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stream error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid grid-cols-[1fr_320px] flex-1 min-h-0">
      {/* Thread + composer */}
      <div className="flex flex-col border-r border-line">
        <div ref={threadRef} className="flex-1 overflow-auto px-10 py-8">
          <div className="max-w-[720px]">
            {thread.map((m) => (
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
              </div>
            ))}
            {error && (
              <div className="text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45] mb-4">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-line bg-surface px-10 py-5">
          <form
            className="max-w-[720px]"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
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

      {/* Citation panel */}
      <aside className="bg-surface px-5 py-6 overflow-auto">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          Sources · {sources.filter((s) => s.status === "verified").length} verified
          {sources.some((s) => s.status === "unverified") &&
            ` · ${sources.filter((s) => s.status === "unverified").length} unverified`}
        </div>
        {sources.map((s) => {
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
              <div className={`text-[10.5px] font-mono mt-[2px] ${isUnverified ? "text-accent" : "text-muted"}`}>
                {s.meta}
              </div>
            </button>
          );
        })}
        <p className="mt-6 text-[11.5px] text-muted leading-[1.5]">
          Click a source to open the full decision. Dashed pills mark citations
          not grounded in the corpus — verify before using.
        </p>
      </aside>
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
