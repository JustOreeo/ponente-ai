import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/app/topbar";
import { BtnPrimary } from "@/components/buttons";

export const metadata: Metadata = {
  title: "Library — Ponente",
};

type Doc = {
  id: string;
  title: string;
  type: string;
  citations: number;
  status: "drafting" | "review" | "final";
  updated: string;
  href: string;
};

const DOCS: Doc[] = [
  {
    id: "demo-letter",
    title: "Demand to Globe Telecom · unpaid services",
    type: "Demand Letter",
    citations: 3,
    status: "drafting",
    updated: "Today, 14:22",
    href: "/draft/demo-letter",
  },
  {
    id: "lic-loss",
    title: "Affidavit of Loss · driver's license",
    type: "Affidavit",
    citations: 1,
    status: "final",
    updated: "Yesterday",
    href: "/draft/demo-letter",
  },
  {
    id: "reyes-acme",
    title: "NLRC Position Paper · Reyes v. ACME Manufacturing",
    type: "Position Paper",
    citations: 7,
    status: "review",
    updated: "2 days ago",
    href: "/draft/demo-letter",
  },
  {
    id: "tan-mr",
    title: "Motion for Reconsideration · Spouses Tan",
    type: "MR",
    citations: 4,
    status: "drafting",
    updated: "3 days ago",
    href: "/draft/demo-letter",
  },
  {
    id: "chat-rent",
    title: "Q&A · advance rent under R.A. 9653",
    type: "Q&A thread",
    citations: 4,
    status: "final",
    updated: "Last week",
    href: "/chat",
  },
];

function StatusBadge({ status }: { status: Doc["status"] }) {
  const config = {
    drafting: { color: "var(--color-accent)", label: "Drafting" },
    review: { color: "var(--color-gold)", label: "Review" },
    final: { color: "var(--color-success)", label: "Final" },
  }[status];
  return (
    <span className="inline-flex items-center gap-[6px]">
      <span
        className="w-[6px] h-[6px] rounded-full"
        style={{ background: config.color }}
      />
      <span className="text-[12.5px] text-ink-soft">{config.label}</span>
    </span>
  );
}

export default function LibraryPage() {
  return (
    <>
      <Topbar
        crumbs={[{ label: "Library" }]}
        right={
          <Link href="/draft/new" className="no-underline">
            <BtnPrimary small>New draft →</BtnPrimary>
          </Link>
        }
      />

      <div className="px-10 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h1
              className="font-serif text-[32px] font-normal m-0"
              style={{ letterSpacing: "-0.015em" }}
            >
              Your library.
            </h1>
            <p className="text-[13.5px] text-muted mt-1 m-0">
              5 documents · 19 citations · last week
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted">
            <FilterChip active>All</FilterChip>
            <FilterChip>Drafting</FilterChip>
            <FilterChip>Review</FilterChip>
            <FilterChip>Final</FilterChip>
          </div>
        </div>

        <div className="border-t border-line">
          <div className="grid grid-cols-[2.5fr_1fr_0.7fr_0.8fr_0.9fr] gap-4 px-4 py-3 bg-surface border-b border-line text-[10.5px] font-mono tracking-[0.14em] uppercase text-muted">
            <span>Document</span>
            <span>Type</span>
            <span>Citations</span>
            <span>Status</span>
            <span className="text-right">Updated</span>
          </div>
          {DOCS.map((d) => (
            <Link
              key={d.id}
              href={d.href}
              className="grid grid-cols-[2.5fr_1fr_0.7fr_0.8fr_0.9fr] gap-4 px-4 py-4 border-b border-line-soft no-underline text-ink hover:bg-surface transition-colors items-baseline"
            >
              <span className="font-serif text-[15px] text-ink">{d.title}</span>
              <span className="text-[13px] text-ink-soft">{d.type}</span>
              <span className="text-[13px] font-mono text-ink-soft">
                {d.citations}
              </span>
              <span>
                <StatusBadge status={d.status} />
              </span>
              <span className="text-[12.5px] text-muted text-right font-mono tracking-[0.02em]">
                {d.updated}
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-6 text-[12px] text-muted italic">
          Verify with the source decision before relying on this in pleadings.
        </p>
      </div>
    </>
  );
}

function FilterChip({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <span
      className={`px-3 py-[5px] border rounded-[2px] text-[12px] cursor-pointer transition-colors ${
        active
          ? "border-ink text-ink bg-surface"
          : "border-line text-muted hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </span>
  );
}
