type Benefit = {
  num: string;
  tag: string;
  head: string;
  body: string;
};

type Props = {
  title: string;
  /** Optional aside displayed at the right of the title row. */
  aside?: string;
  items: Benefit[];
  /** Number of columns. 3 = matches homepage feature grid. 2 for pairwise. */
  cols?: 2 | 3;
};

export function BenefitGrid({ title, aside, items, cols = 3 }: Props) {
  const colClass =
    cols === 2
      ? "grid-cols-1 md:grid-cols-2"
      : "grid-cols-1 md:grid-cols-3";
  return (
    <section className="px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-[72px]">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-8 md:mb-10 gap-4 md:gap-8">
        <h2
          className="font-serif text-[32px] sm:text-[38px] lg:text-[44px] font-normal m-0 max-w-[520px]"
          style={{ letterSpacing: "-0.018em", lineHeight: 1.05 }}
        >
          {title}
        </h2>
        {aside && (
          <p
            className="text-[13.5px] text-muted max-w-[320px] m-0"
            style={{ lineHeight: 1.5 }}
          >
            {aside}
          </p>
        )}
      </div>
      <div className={`grid ${colClass} border-t border-line md:border-b`}>
        {items.map((f, i) => (
          <article
            key={f.num}
            className={`px-6 sm:px-7 py-7 sm:py-8 ${
              i > 0
                ? cols === 2
                  ? "border-t border-line md:border-t-0 md:border-l"
                  : "border-t border-line md:border-t-0 md:border-l"
                : ""
            }`}
          >
            <div className="flex items-center justify-between mb-[18px]">
              <span className="font-mono text-[10.5px] text-accent tracking-[0.18em] uppercase">
                {f.num} · {f.tag}
              </span>
            </div>
            <h3
              className="font-serif text-[22px] sm:text-[24px] lg:text-[26px] font-medium m-0 mb-3"
              style={{ letterSpacing: "-0.012em", lineHeight: 1.15 }}
            >
              {f.head}
            </h3>
            <p
              className="text-[14.5px] text-ink-soft m-0"
              style={{ lineHeight: 1.55, textWrap: "pretty" }}
            >
              {f.body}
            </p>
          </article>
        ))}
      </div>
      {/* Bottom border for mobile single-col layout */}
      <div className="border-b border-line md:hidden" />
    </section>
  );
}
