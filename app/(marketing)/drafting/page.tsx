import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { BenefitGrid } from "@/components/marketing/benefit-grid";
import { BtnPrimary, BtnGhost, BtnLight } from "@/components/buttons";
import { DraftingPreview } from "../_home/drafting-preview";

export const metadata: Metadata = {
  title: "Drafting — Ponente",
  description:
    "Five drafting templates for Philippine practice: demand letters, affidavits, NLRC position papers, motions for reconsideration, verified petitions.",
};

const TEMPLATES = [
  {
    code: "T01",
    name: "Demand Letter",
    blurb:
      "Your facts in. A formal demand for payment, performance, or vacation of premises out — with the cited Civil Code articles and supporting jurisprudence.",
    typical: "8 minutes from facts to send-ready letter.",
  },
  {
    code: "T02",
    name: "Affidavit of Loss",
    blurb:
      "Driver's license, passport, OR/CR, IDs, certificates. Sworn statement structure with the right notarization clauses for Philippine practice.",
    typical: "3 minutes. Print, notarize, file.",
  },
  {
    code: "T03",
    name: "NLRC Position Paper",
    blurb:
      "Labor disputes — illegal dismissal, money claims, regularization. Cites Labor Code provisions and the cases that anchor each argument.",
    typical: "20 minutes for what used to be an afternoon.",
  },
  {
    code: "T04",
    name: "Motion for Reconsideration",
    blurb:
      "Reframes the issues, cites the case the court missed, and stays inside the procedural rules. We pull the doctrine; you supply the facts.",
    typical: "12 minutes for first draft.",
  },
  {
    code: "T05",
    name: "Verified Petition",
    blurb:
      "Certiorari, prohibition, mandamus. We scaffold the verification, certification of non-forum shopping, and the substantive grounds with citations.",
    typical: "30 minutes — ready for partner review.",
  },
];

const STEPS = [
  {
    num: "01",
    tag: "Inputs",
    head: "Tell us the facts.",
    body: "Names, dates, amounts, the obligation that wasn't met. Five fields, not fifty.",
  },
  {
    num: "02",
    tag: "Draft",
    head: "Watch it write.",
    body: "Streams as it writes. Citations populate the side panel as each is grounded.",
  },
  {
    num: "03",
    tag: "Review",
    head: "Ship the .docx.",
    body: "Edit in-place, verify each citation against its source PDF, export to Word, file.",
  },
];

export default function DraftingPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Drafting · the wedge"
        headline={
          <>
            Pleadings,{" "}
            <em className="italic text-accent">ready in minutes.</em>
          </>
        }
        sub="Five templates at launch — chosen because they're what every Philippine practitioner files most. Facts in, draft out, citations attached."
        cta={
          <>
            <Link href="/sign-up" className="no-underline">
              <BtnPrimary>Draft your first pleading →</BtnPrimary>
            </Link>
            <BtnGhost>Watch a 90-sec demo</BtnGhost>
          </>
        }
      />

      {/* Live preview */}
      <section style={{ padding: "0 56px 88px" }}>
        <DraftingPreview />
        <p className="mt-4 text-[12px] text-muted italic">
          Verify with the source decision before relying on this in pleadings.
        </p>
      </section>

      <BenefitGrid
        title="How it works."
        aside="Three steps, each takes minutes. The drafting workspace streams output and grounds every citation as it goes."
        items={STEPS}
      />

      {/* Templates list */}
      <section id="templates" style={{ padding: "88px 56px 72px" }}>
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          Templates · 5 at launch
        </div>
        <h2
          className="font-serif text-[36px] font-normal m-0 mb-10"
          style={{ letterSpacing: "-0.015em", lineHeight: 1.05 }}
        >
          Pick what you actually file.
        </h2>
        <div className="border-t border-line">
          {TEMPLATES.map((t) => (
            <article
              key={t.code}
              className="grid grid-cols-[100px_1fr_220px] gap-10 py-8 border-b border-line-soft items-baseline"
            >
              <div className="font-mono text-[10.5px] text-accent tracking-[0.18em] uppercase">
                {t.code}
              </div>
              <div>
                <h3
                  className="font-serif text-[24px] font-medium m-0 mb-2"
                  style={{ letterSpacing: "-0.012em" }}
                >
                  {t.name}
                </h3>
                <p
                  className="text-[14.5px] text-ink-soft m-0 max-w-[640px]"
                  style={{ lineHeight: 1.55, textWrap: "pretty" }}
                >
                  {t.blurb}
                </p>
              </div>
              <div className="text-[12px] text-muted font-mono leading-[1.5]">
                {t.typical}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 text-[13.5px] text-muted">
          More templates ship each quarter. Roadmap drives by what users
          actually file.
        </p>
      </section>

      {/* Bottom CTA */}
      <section
        className="bg-ink text-parchment"
        style={{ padding: "72px 56px" }}
      >
        <div className="flex items-center justify-between gap-8">
          <h2
            className="font-serif text-[40px] font-normal m-0 max-w-[640px] text-parchment"
            style={{ letterSpacing: "-0.018em", lineHeight: 1.08 }}
          >
            Other tools answer.{" "}
            <em className="italic text-gold">Ponente writes.</em>
          </h2>
          <Link href="/sign-up" className="no-underline shrink-0">
            <BtnLight>Start drafting →</BtnLight>
          </Link>
        </div>
      </section>
    </>
  );
}
