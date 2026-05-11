"use client";

import { useState } from "react";
import Link from "next/link";
import { renderWithCitations } from "@/components/citation-rendered";
import { readEvents } from "@/lib/ai/stream";
import type { Citation } from "@/lib/ai/events";

const INITIAL_BODY =
  "Re: Demand for Payment\n\n**Dear Mr. Tan,**\n\nThis is a formal demand for the immediate payment of **₱847,500.00**, representing unpaid services rendered by GoCloud Inc. under the Service Agreement dated 14 March 2024 between the parties.\n\nUnder [[Art. 1169]] *Civil Code of the Philippines*, your obligation became demandable upon the lapse of the agreed period. Continued non-payment constitutes *mora solvendi*, with the corresponding legal consequences under Articles 1170 and 1171.\n\nThe Supreme Court has consistently affirmed that demand may be effected through extrajudicial means, see [[G.R. No. 196444]] *Solid Homes v. Spouses Tan* (2014). Further, the accrual of legal interest on monetary obligations is well settled under [[G.R. No. 175852]] *Spouses Reyes v. BPI* (2010).\n\nFailure to remit the full amount within **fifteen (15) calendar days** from receipt hereof shall compel us to pursue all available legal remedies, including the filing of a complaint for collection of sum of money, with damages and costs of suit.\n\nWe trust that this matter shall be settled amicably and promptly.\n\nVery truly yours,\n\n**Atty. Maria Reyes**\nReyes Law Office · Roll No. 78XXX · IBP No. 2026-XXXX";

const INITIAL_CITATIONS: Citation[] = [
  {
    tag: "Art. 1169",
    name: "Civil Code of the Philippines",
    meta: "Republic Act · verified",
    status: "verified",
  },
  {
    tag: "G.R. No. 196444",
    name: "Solid Homes v. Spouses Tan",
    meta: "2014 · 2nd Division · still good law",
    status: "verified",
  },
  {
    tag: "G.R. No. 175852",
    name: "Spouses Reyes v. BPI",
    meta: "2010 · En Banc · still good law",
    status: "verified",
  },
];

const FACTS = {
  recipient: "Mr. Edgardo Tan · Globe Telecom Subscriber",
  obligation: "unpaid services under SLA dated 14 Mar 2024",
  amount: "₱847,500.00",
  period: "fifteen (15) calendar days",
  sender: "Reyes Law Office",
};

export function DraftWorkspace() {
  const [body, setBody] = useState(INITIAL_BODY);
  const [citations, setCitations] = useState<Citation[]>(INITIAL_CITATIONS);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    if (streaming) return;
    setStreaming(true);
    setError(null);
    setBody("");
    setCitations([]);

    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template: "demand", facts: FACTS }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      for await (const event of readEvents(res)) {
        if (event.type === "text") {
          setBody((prev) => prev + event.delta);
        } else if (event.type === "citation") {
          const c = event.citation;
          setCitations((prev) =>
            prev.some((p) => p.tag === c.tag) ? prev : [...prev, c],
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stream error.");
    } finally {
      setStreaming(false);
    }
  }

  const verifiedCount = citations.filter(
    (c) => c.status === "verified",
  ).length;
  const unverifiedCount = citations.length - verifiedCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] flex-1 min-h-0">
      {/* Inputs + Document */}
      <div className="flex flex-col lg:border-r lg:border-line overflow-auto">
        {/* Action bar */}
        <div className="flex items-center justify-between px-5 py-3 sm:px-8 sm:py-4 lg:px-10 border-b border-line bg-parchment gap-3">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted">
            Draft · v3 · live
          </div>
          <div className="flex items-center gap-3">
            {streaming && (
              <span className="font-mono text-[10.5px] text-accent tracking-[0.06em]">
                Streaming…
              </span>
            )}
            <button
              type="button"
              onClick={regenerate}
              disabled={streaming}
              className="bg-ink text-parchment border-0 px-3 py-[6px] font-sans text-[12px] font-medium rounded-[2px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {streaming ? "Generating…" : "Regenerate ↻"}
            </button>
          </div>
        </div>

        {/* Facts panel */}
        <div className="border-b border-line bg-surface px-5 py-5 sm:px-8 sm:py-6 lg:px-10">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
            Facts · 5 fields
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 max-w-[760px]">
            <FactRow
              label="Demanding party"
              value="Reyes Law Office, on behalf of GoCloud Inc."
            />
            <FactRow label="Recipient" value={FACTS.recipient} />
            <FactRow label="Obligation" value={FACTS.obligation} />
            <FactRow
              label="Amount"
              value={`${FACTS.amount} (eight hundred forty-seven thousand five hundred)`}
            />
            <FactRow label="Demand period" value={FACTS.period} />
            <FactRow
              label="Practice area"
              value="Civil · obligations and contracts"
            />
          </div>
          <Link
            href="#"
            className="text-[12px] text-accent font-mono no-underline mt-4 inline-block tracking-[0.04em]"
          >
            Edit facts ↗
          </Link>
        </div>

        {/* Draft body */}
        <article
          className="px-5 py-7 sm:px-10 sm:py-10 lg:px-12 font-serif text-[14.5px] sm:text-[15px] text-ink leading-[1.7] flex-1"
          style={{ maxWidth: 780 }}
        >
          {body ? (
            renderWithCitations(body)
          ) : (
            <p className="text-muted italic m-0">
              Click <strong className="text-ink">Regenerate</strong> to stream
              a fresh draft.
            </p>
          )}
          {error && (
            <div className="mt-6 text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45]">
              {error}
            </div>
          )}
        </article>
      </div>

      {/* Citations panel — stacks below body on mobile */}
      <aside className="bg-surface px-5 py-6 overflow-auto border-t border-line lg:border-t-0">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          Citations · {verifiedCount} verified · {unverifiedCount} unverified
        </div>
        {citations.length === 0 ? (
          <p className="text-[12px] text-muted italic m-0">
            Citations will appear as the draft streams.
          </p>
        ) : (
          citations.map((c) => (
            <div key={c.tag} className="border-t border-line-soft py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-[5px] bg-surface-alt border border-line px-2 py-[1px] font-mono text-[10.5px] text-ink">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  {c.tag}
                </div>
                <span
                  className="font-mono text-[10px] tracking-[0.06em]"
                  style={{
                    color:
                      c.status === "verified"
                        ? "var(--color-success)"
                        : "var(--color-accent)",
                  }}
                >
                  {c.status === "verified" ? "✓ verified" : "! unverified"}
                </span>
              </div>
              <div className="font-serif italic text-[13px] text-ink leading-[1.4] mb-1">
                {c.name}
              </div>
              <div className="text-[10.5px] text-muted font-mono">{c.meta}</div>
              <Link
                href="#"
                className="inline-block mt-2 text-[11.5px] text-accent no-underline font-mono tracking-[0.04em]"
              >
                Open source PDF →
              </Link>
            </div>
          ))
        )}

        <div className="mt-8 pt-6 border-t border-line">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-2">
            Versions
          </div>
          <div className="text-[12px] text-ink-soft">
            <div className="py-[5px]">
              <span className="font-mono text-[10.5px]">v3</span> · current
            </div>
            <div className="py-[5px] text-muted">
              <span className="font-mono text-[10.5px]">v2</span> · 13:48
            </div>
            <div className="py-[5px] text-muted">
              <span className="font-mono text-[10.5px]">v1</span> · 13:30
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-1">
        {label}
      </div>
      <div className="text-[13.5px] text-ink leading-[1.4]">{value}</div>
    </div>
  );
}
