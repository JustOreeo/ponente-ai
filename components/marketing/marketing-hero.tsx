import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  /** Headline. Use <em> for the accent word(s). */
  headline: ReactNode;
  sub: string;
  cta?: ReactNode;
};

/**
 * Section hero used by interior marketing pages (drafting, qa, citations,
 * for-firms, pricing, about, etc). Mirrors the homepage hero's left column,
 * minus the side artifact.
 */
export function MarketingHero({ eyebrow, headline, sub, cta }: Props) {
  return (
    <section style={{ padding: "88px 56px 48px" }}>
      <div className="max-w-[820px]">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted mb-5">
          <span className="text-accent">●</span>&nbsp;&nbsp;{eyebrow}
        </div>
        <h1
          className="font-serif text-[64px] font-normal m-0"
          style={{ lineHeight: 1.04, letterSpacing: "-0.025em" }}
        >
          {headline}
        </h1>
        <p
          className="text-[17.5px] text-ink-soft my-6 max-w-[640px]"
          style={{ lineHeight: 1.55, textWrap: "pretty" }}
        >
          {sub}
        </p>
        {cta && <div className="flex gap-3 items-center mt-8">{cta}</div>}
      </div>
    </section>
  );
}
