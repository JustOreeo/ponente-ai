import type { ReactNode } from "react";

/**
 * Long-form typographic wrapper for legal/utility pages (privacy, terms,
 * about). Constrains measure, sets serif body, scales headings.
 */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <article
      className="prose-ponente max-w-[720px] mx-auto font-serif text-[17px] text-ink-soft"
      style={{ padding: "72px 56px 96px", lineHeight: 1.65 }}
    >
      {children}
      <style>{`
        .prose-ponente h1 {
          font-family: var(--font-serif);
          font-size: 56px;
          font-weight: 400;
          color: var(--color-ink);
          letter-spacing: -0.025em;
          line-height: 1.04;
          margin: 0 0 8px;
        }
        .prose-ponente .lede {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-muted);
          margin-bottom: 20px;
        }
        .prose-ponente h2 {
          font-family: var(--font-serif);
          font-size: 28px;
          font-weight: 500;
          color: var(--color-ink);
          letter-spacing: -0.012em;
          line-height: 1.15;
          margin: 56px 0 16px;
        }
        .prose-ponente h3 {
          font-family: var(--font-sans);
          font-size: 17px;
          font-weight: 600;
          color: var(--color-ink);
          margin: 32px 0 8px;
        }
        .prose-ponente p {
          margin: 0 0 18px;
          text-wrap: pretty;
        }
        .prose-ponente ul, .prose-ponente ol {
          padding-left: 24px;
          margin: 0 0 18px;
        }
        .prose-ponente li {
          margin: 6px 0;
        }
        .prose-ponente a {
          color: var(--color-accent);
          text-underline-offset: 2px;
        }
        .prose-ponente hr {
          border: 0;
          border-top: 1px solid var(--color-line);
          margin: 56px 0;
        }
        .prose-ponente .meta {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-muted);
          letter-spacing: 0.04em;
          margin-bottom: 56px;
        }
      `}</style>
    </article>
  );
}
