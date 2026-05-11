import type { ReactNode } from "react";

type Status = "verified" | "unverified";

type CitationPillProps = {
  children: ReactNode;
  /** Verified (oxblood pip) or unverified (muted pip + dashed border). Default: verified. */
  status?: Status;
  /** Optional click handler — when set, the pill becomes a button. */
  onClick?: () => void;
  /** Optional title attribute (rendered as a native tooltip). */
  title?: string;
};

/**
 * Inline citation pill — appears in chat answers and drafts.
 * Verified pills (status="verified") have an oxblood pip and solid border.
 * Unverified pills (status="unverified") have a muted pip and dashed border —
 * Claude is reminded by the system prompt not to invent citations, but if it
 * does, the UI flags them visually.
 */
export function CitationPill({
  children,
  status = "verified",
  onClick,
  title,
}: CitationPillProps) {
  const pipColor =
    status === "verified" ? "bg-accent" : "bg-muted";
  const borderStyle =
    status === "verified" ? "border-line" : "border-dashed border-muted";
  const cursor = onClick ? "cursor-pointer" : "cursor-default";

  const Tag: "button" | "span" = onClick ? "button" : "span";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={
        title ??
        (status === "unverified"
          ? "Source not verified against the corpus — check before relying on this."
          : undefined)
      }
      className={`inline-flex items-center gap-1 bg-surface-alt text-ink border ${borderStyle} px-2 py-[1px] mx-[3px] font-mono text-[11.5px] font-medium not-italic rounded-[2px] align-baseline ${cursor} appearance-none`}
    >
      <span className={`inline-block w-1 h-1 rounded-full ${pipColor}`} />
      {children}
    </Tag>
  );
}
