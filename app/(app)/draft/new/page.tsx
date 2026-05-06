import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/app/topbar";

export const metadata: Metadata = {
  title: "New draft — Ponente",
};

const TEMPLATES = [
  {
    code: "T01",
    slug: "demand",
    name: "Demand Letter",
    blurb: "Formal demand for payment, performance, or vacation of premises.",
    minutes: "~8 min",
  },
  {
    code: "T02",
    slug: "affidavit",
    name: "Affidavit of Loss",
    blurb: "License, passport, OR/CR, IDs — with proper notarization clauses.",
    minutes: "~3 min",
  },
  {
    code: "T03",
    slug: "nlrc",
    name: "NLRC Position Paper",
    blurb: "Labor disputes — illegal dismissal, money claims, regularization.",
    minutes: "~20 min",
  },
  {
    code: "T04",
    slug: "mr",
    name: "Motion for Reconsideration",
    blurb: "Reframes issues, cites the case the court missed.",
    minutes: "~12 min",
  },
  {
    code: "T05",
    slug: "petition",
    name: "Verified Petition",
    blurb: "Certiorari, prohibition, mandamus — verification + cert. of NFS.",
    minutes: "~30 min",
  },
];

export default function NewDraftPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Library", href: "/library" },
          { label: "New draft" },
        ]}
      />

      <div className="px-10 py-10">
        <h1
          className="font-serif text-[36px] font-normal m-0 mb-2"
          style={{ letterSpacing: "-0.018em" }}
        >
          What are you drafting?
        </h1>
        <p className="text-[14px] text-muted mb-8 max-w-[560px] leading-[1.55]">
          Pick a template. Each one asks the questions Ponente needs and
          produces a draft with verified citations. You edit and export to
          .docx.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-[920px]">
          {TEMPLATES.map((t) => (
            <Link
              key={t.code}
              href="/draft/demo-letter"
              className="bg-surface border border-line p-6 no-underline text-ink hover:border-ink transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10.5px] text-accent tracking-[0.18em] uppercase">
                  {t.code}
                </span>
                <span className="font-mono text-[10.5px] text-muted">
                  {t.minutes}
                </span>
              </div>
              <h3
                className="font-serif text-[22px] font-medium m-0 mb-2"
                style={{ letterSpacing: "-0.012em" }}
              >
                {t.name}
              </h3>
              <p className="text-[13.5px] text-ink-soft m-0 leading-[1.55]">
                {t.blurb}
              </p>
              <div className="mt-4 text-[12px] text-accent font-mono tracking-[0.04em]">
                Start →
              </div>
            </Link>
          ))}

          {/* Custom card */}
          <div className="bg-parchment border border-dashed border-line p-6 flex items-center justify-center text-center">
            <div>
              <div className="font-mono text-[10.5px] text-muted tracking-[0.18em] uppercase mb-2">
                Need something else?
              </div>
              <p className="text-[13.5px] text-ink-soft m-0 mb-3 leading-[1.55] max-w-[260px]">
                More templates ship each quarter. Tell us what you file most.
              </p>
              <Link
                href="/contact"
                className="text-[13px] text-accent no-underline"
              >
                Send us a request →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
