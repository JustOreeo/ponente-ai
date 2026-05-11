"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
  /** What the user was trying to do — colours the headline. */
  type: "qa" | "draft";
  /** Current usage / limit, shown for context. */
  used?: number;
  limit?: number | "unlimited";
};

const COPY = {
  qa: {
    head: "You've used today's free questions.",
    sub: "Free includes 5 Q&A questions per day. Pro is unlimited and unlocks drafting.",
  },
  draft: {
    head: "Drafting is a Pro feature.",
    sub: "Free is for Q&A. Pro turns your facts into pleadings, affidavits, and position papers — with verified citations.",
  },
};

export function PaywallModal({ open, onClose, type, used, limit }: Props) {
  if (!open) return null;
  const { head, sub } = COPY[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(26, 36, 56, 0.55)" }}
      onClick={onClose}
    >
      <div
        className="bg-parchment border border-line max-w-[480px] w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent mb-4">
          Upgrade to Pro
        </div>
        <h2
          className="font-serif text-[28px] font-normal leading-[1.1] m-0 mb-3"
          style={{ letterSpacing: "-0.018em" }}
        >
          {head}
        </h2>
        <p className="text-[14px] text-ink-soft leading-[1.55] m-0 mb-6">
          {sub}
        </p>

        {typeof used === "number" && limit !== undefined && limit !== "unlimited" && (
          <div className="bg-surface border border-line px-4 py-3 mb-6">
            <div className="flex items-center justify-between text-[12px] text-muted font-mono">
              <span>Today's usage</span>
              <span className="text-ink">
                {used} / {limit}
              </span>
            </div>
          </div>
        )}

        <ul className="m-0 mb-7 p-0 list-none border-t border-line-soft">
          <Bullet>Unlimited Q&A</Bullet>
          <Bullet>All 5 drafting templates</Bullet>
          <Bullet>Citation panel + .docx export</Bullet>
        </ul>

        <div className="flex items-center justify-between gap-4">
          <Link
            href="/pricing"
            className="bg-ink text-parchment px-4 py-[10px] font-sans text-[13px] font-medium rounded-[2px] no-underline"
          >
            See pricing →
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-0 text-muted text-[12.5px] font-medium hover:text-ink transition-colors cursor-pointer"
          >
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 py-2 border-b border-line-soft last:border-b-0 text-[13.5px] text-ink-soft">
      <span aria-hidden className="font-mono text-[12px] text-accent">·</span>
      {children}
    </li>
  );
}
