export type Tier = {
  slug: string;
  name: string;
  price: string;
  sub: string;
  feats: string[];
  highlight?: boolean;
};

export const TIERS: Tier[] = [
  {
    slug: "free",
    name: "Free",
    price: "₱0",
    sub: "forever",
    feats: ["5 questions / day", "Q&A only", "1 user"],
  },
  {
    slug: "pro",
    name: "Pro",
    price: "₱1,499",
    sub: "/month",
    feats: [
      "Unlimited Q&A",
      "All 5 drafting templates",
      "Citation panel + .docx export",
    ],
    highlight: true,
  },
  {
    slug: "small-firm",
    name: "Small Firm",
    price: "₱1,199",
    sub: "/seat/mo · annual",
    feats: ["Everything in Pro", "Team library + sharing", "Admin & SSO"],
  },
];

export function PricingGrid({ tiers = TIERS }: { tiers?: Tier[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 border border-line">
      {tiers.map((t, i) => (
        <div
          key={t.slug}
          id={t.slug}
          className={`px-6 sm:px-7 py-7 sm:py-8 relative ${
            i < tiers.length - 1
              ? "border-b border-line md:border-r md:border-b-0"
              : ""
          }`}
          style={{
            background: t.highlight ? "var(--color-surface)" : "transparent",
          }}
        >
          {t.highlight && (
            <div className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.14em] uppercase text-accent">
              Most picked
            </div>
          )}
          <div className="text-[13px] font-semibold tracking-[0.06em] uppercase text-muted mb-3">
            {t.name}
          </div>
          <div className="flex items-baseline gap-[6px] mb-[18px]">
            <span
              className="font-serif text-[36px] sm:text-[40px] font-medium"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t.price}
            </span>
            <span className="text-[13px] text-muted">{t.sub}</span>
          </div>
          <div className="border-t border-line-soft pt-[14px]">
            {t.feats.map((f) => (
              <div
                key={f}
                className="text-[13.5px] text-ink-soft py-[5px] flex gap-2 items-start"
              >
                <span className="text-accent font-mono text-[12px]">·</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
