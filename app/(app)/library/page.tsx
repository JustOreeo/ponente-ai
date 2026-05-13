import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/app/topbar";
import { BtnPrimary } from "@/components/buttons";
import { listChats } from "@/lib/persist/chats";
import { listDrafts } from "@/lib/persist/drafts";
import { requireProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Library — Ponente",
};

export const dynamic = "force-dynamic";

type LibraryItem = {
  kind: "chat" | "draft";
  id: string;
  title: string;
  updated_at: string;
  type: string;
  citations: number | null;
  status: "drafting" | "review" | "final" | null;
  href: string;
};

const TEMPLATE_LABEL: Record<string, string> = {
  demand: "Demand Letter",
  affidavit: "Affidavit of Loss",
  nlrc: "NLRC Position Paper",
  mr: "Motion for Reconsideration",
  petition: "Verified Petition",
};

function relativeTimePH(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = Math.max(0, now - then);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diffMs < min) return "just now";
  if (diffMs < hour) return `${Math.floor(diffMs / min)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 2 * day) return "yesterday";
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)} days ago`;
  return new Date(iso).toLocaleDateString("en-PH", { timeZone: "Asia/Manila" });
}

function StatusBadge({
  status,
}: {
  status: "drafting" | "review" | "final";
}) {
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

function ChatBadge() {
  return (
    <span className="inline-flex items-center gap-[6px]">
      <span className="w-[6px] h-[6px] rounded-full bg-ink-soft" />
      <span className="text-[12.5px] text-ink-soft">Q&amp;A</span>
    </span>
  );
}

export default async function LibraryPage() {
  await requireProfile();
  const [chats, drafts] = await Promise.all([listChats(), listDrafts()]);

  const items: LibraryItem[] = [
    ...chats.map<LibraryItem>((c) => ({
      kind: "chat",
      id: c.id,
      title: c.title,
      updated_at: c.updated_at,
      type: "Q&A thread",
      citations: null,
      status: null,
      href: `/chat/${c.id}`,
    })),
    ...drafts.map<LibraryItem>((d) => ({
      kind: "draft",
      id: d.id,
      title: d.title,
      updated_at: d.updated_at,
      type: TEMPLATE_LABEL[d.template] ?? d.template,
      citations: Array.isArray(d.citations) ? d.citations.length : 0,
      status: d.status,
      href: `/draft/saved/${d.id}`,
    })),
  ].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const totalCitations = drafts.reduce(
    (acc, d) => acc + (Array.isArray(d.citations) ? d.citations.length : 0),
    0,
  );

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

      <div className="px-6 sm:px-10 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-6 gap-4">
          <div>
            <h1
              className="font-serif text-[26px] sm:text-[30px] lg:text-[32px] font-normal m-0"
              style={{ letterSpacing: "-0.015em" }}
            >
              Your library.
            </h1>
            <p className="text-[13.5px] text-muted mt-1 m-0">
              {items.length} {items.length === 1 ? "item" : "items"}
              {totalCitations > 0 && ` · ${totalCitations} citations`}
              {items[0] && ` · ${relativeTimePH(items[0].updated_at)}`}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block border-t border-line">
              <div className="grid grid-cols-[2.5fr_1fr_0.7fr_0.8fr_0.9fr] gap-4 px-4 py-3 bg-surface border-b border-line text-[10.5px] font-mono tracking-[0.14em] uppercase text-muted">
                <span>Document</span>
                <span>Type</span>
                <span>Citations</span>
                <span>Status</span>
                <span className="text-right">Updated</span>
              </div>
              {items.map((d) => (
                <Link
                  key={`${d.kind}-${d.id}`}
                  href={d.href}
                  className="grid grid-cols-[2.5fr_1fr_0.7fr_0.8fr_0.9fr] gap-4 px-4 py-4 border-b border-line-soft no-underline text-ink hover:bg-surface transition-colors items-baseline"
                >
                  <span className="font-serif text-[15px] text-ink truncate">
                    {d.title}
                  </span>
                  <span className="text-[13px] text-ink-soft">{d.type}</span>
                  <span className="text-[13px] font-mono text-ink-soft">
                    {d.citations ?? ""}
                  </span>
                  <span>
                    {d.kind === "chat" ? (
                      <ChatBadge />
                    ) : d.status ? (
                      <StatusBadge status={d.status} />
                    ) : null}
                  </span>
                  <span className="text-[12.5px] text-muted text-right font-mono tracking-[0.02em]">
                    {relativeTimePH(d.updated_at)}
                  </span>
                </Link>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden border-t border-line">
              {items.map((d) => (
                <Link
                  key={`${d.kind}-${d.id}`}
                  href={d.href}
                  className="block px-4 py-4 border-b border-line-soft no-underline text-ink hover:bg-surface transition-colors"
                >
                  <div className="font-serif text-[15px] text-ink mb-2 leading-[1.35]">
                    {d.title}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
                    <div className="flex items-center gap-3">
                      <span className="text-ink-soft">{d.type}</span>
                      {d.citations !== null && (
                        <>
                          <span aria-hidden className="opacity-50">·</span>
                          <span className="font-mono">{d.citations} cites</span>
                        </>
                      )}
                      <span aria-hidden className="opacity-50">·</span>
                      {d.kind === "chat" ? (
                        <ChatBadge />
                      ) : d.status ? (
                        <StatusBadge status={d.status} />
                      ) : null}
                    </div>
                    <span className="font-mono text-[11.5px]">
                      {relativeTimePH(d.updated_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-6 text-[12px] text-muted italic">
              Verify with the source decision before relying on this in
              pleadings.
            </p>
          </>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-line px-6 py-12 sm:py-16 text-center">
      <h2
        className="font-serif text-[22px] sm:text-[26px] font-normal m-0 mb-3"
        style={{ letterSpacing: "-0.015em" }}
      >
        Nothing here yet.
      </h2>
      <p className="text-[14px] text-ink-soft m-0 mb-6 max-w-[420px] mx-auto leading-[1.55]">
        Your Q&amp;A threads and drafted documents will show up here as you
        work. Start with a question or a template.
      </p>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Link href="/chat" className="no-underline">
          <BtnPrimary small>Ask a question →</BtnPrimary>
        </Link>
        <Link
          href="/draft/new"
          className="text-[13px] text-accent no-underline font-mono tracking-[0.04em]"
        >
          Or draft something →
        </Link>
      </div>
    </div>
  );
}
