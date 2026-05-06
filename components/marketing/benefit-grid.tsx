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
  const colClass = cols === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <section style={{ padding: "72px 56px" }}>
      <div className="flex items-baseline justify-between mb-10">
        <h2
          className="font-serif text-[44px] font-normal m-0 max-w-[520px]"
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
      <div className={`grid ${colClass} border-t border-b border-line`}>
        {items.map((f, i) => (
          <article
            key={f.num}
            className={`px-7 py-8 ${i > 0 ? "border-l border-line" : ""}`}
          >
            <div className="flex items-center justify-between mb-[18px]">
              <span className="font-mono text-[10.5px] text-accent tracking-[0.18em] uppercase">
                {f.num} · {f.tag}
              </span>
            </div>
            <h3
              className="font-serif text-[26px] font-medium m-0 mb-3"
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
    </section>
  );
}
