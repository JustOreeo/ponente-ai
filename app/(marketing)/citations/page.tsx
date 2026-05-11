import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { CitationPill } from "@/components/citation-pill";
import { BtnPrimary, BtnLight } from "@/components/buttons";

export const metadata: Metadata = {
  title: "Citations — Ponente",
  description:
    "Real Philippine sources, counted. No hallucinated G.R. numbers. Each output shows verified vs. unverified — and explains why a source did or didn't make it in.",
};

const SOURCE_TYPES: { key: string; label: string; count: string; sub: string }[] = [
  { key: "sc", label: "Supreme Court decisions", count: "~12,400", sub: "1901–present, en banc and divisions" },
  { key: "ra", label: "Republic Acts", count: "~12,000", sub: "Civil Code, Labor Code, R.A.s through 2025" },
  { key: "const", label: "Constitution", count: "1987 + 1973", sub: "Articles, sections, transitory provisions" },
  { key: "rules", label: "Rules of Court", count: "Full text", sub: "Civil, criminal, evidence, special proceedings" },
];

export default function CitationsPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Citations · the trust layer"
        headline={
          <>
            Real ones.{" "}
            <em className="italic text-accent">Counted.</em>
          </>
        }
        sub="Every output Ponente produces is linked back to its source. Verified citations get a green check. Unverified get a red flag. We never auto-trust the model."
        cta={
          <Link href="/sign-up" className="no-underline">
            <BtnPrimary>Try it free →</BtnPrimary>
          </Link>
        }
      />

      {/* Citation pill explainer */}
      <section className="px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14 lg:pb-[88px]">
        <div className="bg-surface border border-line p-6 sm:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
              The citation pill
            </div>
            <p className="font-serif text-[18px] sm:text-[20px] text-ink leading-[1.55] m-0">
              The Court has consistently held that procedural rules may be
              relaxed in the interest of substantial justice
              <CitationPill>G.R. No. 247429</CitationPill>
              <em className="italic"> Heirs of Malate v. Gamboa</em> (2020),
              and the doctrine extends to labor disputes
              <CitationPill>R.A. No. 11058</CitationPill>.
            </p>
            <p className="mt-6 text-[14px] text-muted leading-[1.55]">
              Each pill is a clickable, hoverable, machine-checkable link from
              an output to a source. Ponente&apos;s outputs are full of them.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-accent mb-3">
                Click
              </div>
              <p className="text-[14px] text-ink-soft leading-[1.55] m-0">
                Opens the source PDF, syllabus, ponente, division, and the
                citator status of the case.
              </p>
            </div>
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-accent mb-3">
                Hover
              </div>
              <p className="text-[14px] text-ink-soft leading-[1.55] m-0">
                Tooltip with decision date, ponente justice, and whether
                it&apos;s still good law.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified vs unverified */}
      <section className="px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14 lg:pb-[88px]">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          Verified vs. unverified
        </div>
        <h2
          className="font-serif text-[28px] sm:text-[32px] lg:text-[36px] font-normal m-0 mb-8 lg:mb-10"
          style={{ letterSpacing: "-0.015em", lineHeight: 1.05 }}
        >
          Every citation gets a status.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 border border-line">
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-line">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] text-success">✓</span>
              <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-success">
                Verified
              </span>
            </div>
            <h3 className="font-serif text-[18px] sm:text-[20px] font-medium m-0 mb-3">
              Found in our source corpus.
            </h3>
            <p className="text-[14px] text-ink-soft leading-[1.55] m-0">
              The G.R. number, R.A. number, or constitutional reference
              matches a real entry. The pill links to the source. The
              tooltip shows decision date, ponente, citator status. You can
              cite it.
            </p>
          </div>
          <div className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="font-mono text-[11px] text-accent">!</span>
              <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-accent">
                Unverified
              </span>
            </div>
            <h3 className="font-serif text-[18px] sm:text-[20px] font-medium m-0 mb-3">
              Couldn&apos;t match a source.
            </h3>
            <p className="text-[14px] text-ink-soft leading-[1.55] m-0">
              The model proposed a citation, but our verifier couldn&apos;t
              find it in the corpus. Output flags it red and explains why
              it was kept (close-paraphrase) or pulled (no match). You
              decide.
            </p>
          </div>
        </div>
      </section>

      {/* Sources list */}
      <section
        id="guide"
        className="px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14 lg:pb-[88px]"
      >
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          The corpus
        </div>
        <h2
          className="font-serif text-[28px] sm:text-[32px] lg:text-[36px] font-normal m-0 mb-2"
          style={{ letterSpacing: "-0.015em", lineHeight: 1.05 }}
        >
          What Ponente reads.
        </h2>
        <p className="text-[14px] text-muted max-w-[640px] mb-8 lg:mb-10 leading-[1.6]">
          Philippine sources only. We re-ingest weekly, hand-verify every new
          decision before it joins the corpus. Volumes shown are end-state
          launch targets — see the changelog for what&apos;s live today.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-line">
          {SOURCE_TYPES.map((s, i) => (
            <div
              key={s.key}
              className={`p-6 sm:p-8 ${
                i % 2 === 0 ? "sm:border-r border-line" : ""
              } ${i < SOURCE_TYPES.length - 1 ? "border-b border-line" : ""} ${
                i >= SOURCE_TYPES.length - 2 ? "sm:border-b-0" : ""
              }`}
            >
              <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-accent mb-2">
                {s.label}
              </div>
              <div
                className="font-serif text-[28px] sm:text-[32px] lg:text-[36px] font-medium mb-2"
                style={{ letterSpacing: "-0.018em" }}
              >
                {s.count}
              </div>
              <div className="text-[13px] text-ink-soft">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-parchment px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-[72px]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-8">
          <h2
            className="font-serif text-[28px] sm:text-[34px] lg:text-[40px] font-normal m-0 max-w-[640px] text-parchment"
            style={{ letterSpacing: "-0.018em", lineHeight: 1.08 }}
          >
            We never auto-trust the model.{" "}
            <em className="italic text-gold">Neither should you.</em>
          </h2>
          <Link href="/sign-up" className="no-underline shrink-0">
            <BtnLight>See it for yourself →</BtnLight>
          </Link>
        </div>
      </section>
    </>
  );
}
