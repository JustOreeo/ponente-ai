import type { ReactNode } from "react";

export function CitationPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 bg-surface-alt text-ink border border-line px-2 py-[1px] mx-[3px] font-mono text-[11.5px] font-medium not-italic rounded-[2px] align-baseline cursor-pointer">
      <span className="inline-block w-1 h-1 rounded-full bg-accent" />
      {children}
    </span>
  );
}
