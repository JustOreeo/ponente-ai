import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { BenefitGrid } from "@/components/marketing/benefit-grid";
import { CitationPill } from "@/components/citation-pill";
import { BtnPrimary, BtnGhost, BtnLight } from "@/components/buttons";

export const metadata: Metadata = {
  title: "Q&A — Ponente",
  description:
    "Every answer ships with the cases that support it. Click a citation to read the source decision in a side panel.",
};

const BENEFITS = [
  {
    num: "01",
    tag: "Verified",
    head: "Cited, not invented.",
    body: "Each answer points to a real Supreme Court decision, R.A., or constitutional provision. No hallucinated G.R. numbers.",
  },
  {
    num: "02",
    tag: "Counted",
    head: "Sources on the receipt.",
    body: "Every reply shows how many sources support it — and distinguishes verified from unverified inline.",
  },
  {
    num: "03",
    tag: "Inspect",
    head: "Click to read the source.",
    body: "Tap any citation to open the source decision in a side panel — full text, ponente, division, citator status.",
  },
];

function ChatPreview() {
  return (
    <div className="bg-surface border border-line shadow-[0_24px_60px_#1a243814,0_1px_0_#fff_inset]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-parchment">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted tracking-[0.06em]">
          <span className="w-[6px] h-[6px] rounded-full bg-accent" />
          THREAD · drafted 14 March 2026
        </div>
        <span className="font-mono text-[10px] px-2 py-[3px] bg-success text-parchment tracking-[0.08em]">
          4 SOURCES
        </span>
      </div>

      <div className="grid grid-cols-[1fr_0.55fr] min-h-[420px]">
        {/* Thread */}
        <div className="px-8 py-7 border-r border-line">
          {/* User question */}
          <div className="font-mono text-[10.5px] text-muted tracking-[0.14em] uppercase mb-2">
            You · 14:02
          </div>
          <p className="font-sans text-[14.5px] text-ink m-0 mb-6 leading-[1.55]">
            Can a residential lessor collect rent in advance for the entire
            term, or is that prohibited by law?
          </p>

          {/* Assistant reply */}
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-accent tracking-[0.14em] uppercase mb-2">
            <span className="w-[6px] h-[6px] rounded-full bg-accent" />
            Ponente · 14:02
          </div>
          <div className="font-serif text-[15px] text-ink leading-[1.65]">
            <p className="m-0 mb-3">
              For residential leases, advance rent is regulated. Under{" "}
              <CitationPill>R.A. No. 9653</CitationPill> (the Rent Control Act
              of 2009, as extended), lessors of covered units may demand no
              more than{" "}
              <strong>one (1) month advance rent</strong> and{" "}
              <strong>two (2) months security deposit</strong> at the start of
              the lease.
            </p>
            <p className="m-0 mb-3">
              Outside the Rent Control Act&apos;s coverage (units exceeding the
              monthly cap), the parties may stipulate freely under{" "}
              <CitationPill>Art. 1306, Civil Code</CitationPill> — but the
              terms still cannot run contrary to law, morals, or public order.
            </p>
            <p className="m-0">
              The Court has applied this distinction consistently — see{" "}
              <CitationPill>G.R. No. 196444</CitationPill>{" "}
              <em>Solid Homes v. Spouses Tan</em> (2014), where rent
              demandability under Art. 1169 was anchored to the agreed term.
            </p>
          </div>
        </div>

        {/* Citation panel */}
        <div className="px-[18px] py-5 bg-parchment">
          <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-muted mb-3">
            Sources
          </div>
          {[
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
          ].map((s) => (
            <div key={s.tag} className="border-t border-line-soft py-3">
              <div className="inline-flex items-center gap-[5px] bg-surface-alt border border-line px-2 py-[1px] font-mono text-[10.5px] text-ink mb-[6px]">
                <span className="w-1 h-1 rounded-full bg-accent" />
                {s.tag}
              </div>
              <div className="font-serif italic text-[12.5px] text-ink leading-[1.4]">
                {s.name}
              </div>
              <div className="text-[10.5px] text-muted font-mono mt-[2px]">
                {s.meta}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-[10px] border-t border-line bg-parchment text-[11.5px]">
        <span className="text-muted italic">
          Verify with the source decision before relying on this in pleadings.
        </span>
        <span className="bg-ink text-parchment px-[10px] py-[5px] font-sans text-[11.5px] font-medium">
          Ask follow-up →
        </span>
      </div>
    </div>
  );
}

export default function QAPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Q&A · receipts-first"
        headline={
          <>
            Answers with{" "}
            <em className="italic text-accent">receipts.</em>
          </>
        }
        sub="Every reply ships with the Supreme Court decisions, Republic Acts, and constitutional provisions that support it. Click a citation, read the source. No more 'trust me.'"
        cta={
          <>
            <Link href="/sign-up" className="no-underline">
              <BtnPrimary>Ask your first question →</BtnPrimary>
            </Link>
            <BtnGhost>5 free questions per day</BtnGhost>
          </>
        }
      />

      <section style={{ padding: "0 56px 88px" }}>
        <ChatPreview />
      </section>

      <BenefitGrid
        title="The trust loop."
        aside="Verified citations turn an answer into something a lawyer can use. Three things every reply does."
        items={BENEFITS}
      />

      <section
        className="bg-ink text-parchment"
        style={{ padding: "72px 56px" }}
      >
        <div className="flex items-center justify-between gap-8">
          <h2
            className="font-serif text-[40px] font-normal m-0 max-w-[640px] text-parchment"
            style={{ letterSpacing: "-0.018em", lineHeight: 1.08 }}
          >
            Five free questions per day.{" "}
            <em className="italic text-gold">No card required.</em>
          </h2>
          <Link href="/sign-up" className="no-underline shrink-0">
            <BtnLight>Start asking →</BtnLight>
          </Link>
        </div>
      </section>
    </>
  );
}
