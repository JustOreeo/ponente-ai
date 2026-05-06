import type { Metadata } from "next";
import { Topbar } from "@/components/app/topbar";
import { CitationPill } from "@/components/citation-pill";

export const metadata: Metadata = {
  title: "Chat — Ponente",
};

type Msg = { role: "user" | "assistant"; ts: string; body: React.ReactNode };

const THREAD: Msg[] = [
  {
    role: "user",
    ts: "14:01",
    body: (
      <>
        Can a residential lessor collect rent in advance for the entire term,
        or is that prohibited by law?
      </>
    ),
  },
  {
    role: "assistant",
    ts: "14:01",
    body: (
      <>
        <p className="m-0 mb-3">
          For residential leases, advance rent is regulated. Under{" "}
          <CitationPill>R.A. No. 9653</CitationPill> (the Rent Control Act of
          2009, as extended), lessors of covered units may demand no more
          than <strong>one (1) month advance rent</strong> and{" "}
          <strong>two (2) months security deposit</strong> at the start of
          the lease.
        </p>
        <p className="m-0 mb-3">
          Outside the Rent Control Act&apos;s coverage (units exceeding the
          monthly cap), the parties may stipulate freely under{" "}
          <CitationPill>Art. 1306, Civil Code</CitationPill> — but the terms
          still cannot run contrary to law, morals, or public order.
        </p>
        <p className="m-0">
          The Court has applied this distinction consistently — see{" "}
          <CitationPill>G.R. No. 196444</CitationPill>{" "}
          <em>Solid Homes v. Spouses Tan</em> (2014), where rent
          demandability under Art. 1169 was anchored to the agreed term.
        </p>
      </>
    ),
  },
  {
    role: "user",
    ts: "14:04",
    body: <>What if the unit is commercial?</>,
  },
  {
    role: "assistant",
    ts: "14:04",
    body: (
      <>
        <p className="m-0">
          Commercial leases fall outside the Rent Control Act entirely. Under{" "}
          <CitationPill>Art. 1306, Civil Code</CitationPill>, parties enjoy
          freedom of contract — advance rent terms are negotiable so long as
          they aren&apos;t unconscionable. In practice, standard commercial
          leases ask for one to three months advance plus a deposit of one
          to three months; longer prepayments are uncommon and usually
          tied to a discount.
        </p>
      </>
    ),
  },
];

const SOURCES = [
  {
    tag: "R.A. 9653",
    name: "Rent Control Act of 2009",
    meta: "Republic Act · verified",
  },
  {
    tag: "Art. 1306",
    name: "Civil Code of the Philippines",
    meta: "Republic Act · verified",
  },
  {
    tag: "G.R. No. 196444",
    name: "Solid Homes v. Spouses Tan",
    meta: "2014 · 2nd Division",
  },
  {
    tag: "Art. 1169",
    name: "Civil Code of the Philippines",
    meta: "Republic Act · verified",
  },
];

export default function ChatPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Chat", href: "/chat" },
          { label: "Advance rent under R.A. 9653" },
        ]}
        right={
          <span className="font-mono text-[10.5px] text-muted tracking-[0.06em]">
            3 / 5 today
          </span>
        }
      />

      <div className="grid grid-cols-[1fr_320px] flex-1 min-h-0">
        {/* Thread */}
        <div className="flex flex-col border-r border-line">
          <div className="flex-1 overflow-auto px-10 py-8">
            <div className="max-w-[720px]">
              {THREAD.map((m, i) => (
                <div key={i} className="mb-8">
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
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Composer */}
          <div className="border-t border-line bg-surface px-10 py-5">
            <div className="max-w-[720px] flex items-center gap-3 bg-parchment border border-line rounded-[2px] px-4 py-[10px]">
              <input
                placeholder="Ask anything about Philippine law…"
                className="flex-1 bg-transparent border-0 font-sans text-[14px] text-ink focus:outline-none"
              />
              <span className="font-mono text-[10px] text-muted tracking-[0.04em] border border-line px-[5px] py-[1px] rounded-[2px]">
                ↵
              </span>
            </div>
            <p className="text-[11px] text-muted italic mt-3 max-w-[720px] m-0">
              Verify with the source decision before relying on this in
              pleadings.
            </p>
          </div>
        </div>

        {/* Citation panel */}
        <aside className="bg-surface px-5 py-6 overflow-auto">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
            Sources · 4 verified
          </div>
          {SOURCES.map((s) => (
            <div
              key={s.tag}
              className="border-t border-line-soft py-3 cursor-pointer"
            >
              <div className="inline-flex items-center gap-[5px] bg-surface-alt border border-line px-2 py-[1px] font-mono text-[10.5px] text-ink mb-[6px]">
                <span className="w-1 h-1 rounded-full bg-accent" />
                {s.tag}
              </div>
              <div className="font-serif italic text-[13px] text-ink leading-[1.4]">
                {s.name}
              </div>
              <div className="text-[10.5px] text-muted font-mono mt-[2px]">
                {s.meta}
              </div>
            </div>
          ))}
          <p className="mt-6 text-[11.5px] text-muted leading-[1.5]">
            Click a source to open the full decision.
          </p>
        </aside>
      </div>
    </>
  );
}
