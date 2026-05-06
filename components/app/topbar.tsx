import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

type Props = {
  crumbs: Crumb[];
  /** Right-aligned actions (buttons, etc). */
  right?: ReactNode;
};

export function Topbar({ crumbs, right }: Props) {
  return (
    <header
      className="flex items-center justify-between bg-parchment border-b border-line-soft px-7"
      style={{ height: 56, position: "sticky", top: 0, zIndex: 10 }}
    >
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-[13px] text-ink-soft"
      >
        {crumbs.map((c, i) => (
          <span key={c.label} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-muted font-mono text-[10px]">/</span>
            )}
            {c.href ? (
              <a
                href={c.href}
                className="text-muted no-underline hover:text-ink transition-colors"
              >
                {c.label}
              </a>
            ) : (
              <span className="text-ink font-medium">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {/* Search stub */}
        <div className="bg-surface border border-line px-3 py-[6px] flex items-center gap-2 text-[12px] text-muted rounded-[2px]">
          <SearchGlyph />
          <span>Search drafts, citations…</span>
          <span className="font-mono text-[10px] text-muted px-[5px] py-[1px] border border-line rounded-[2px]">
            ⌘P
          </span>
        </div>
        {right}
      </div>
    </header>
  );
}

function SearchGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M11 11 L14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
