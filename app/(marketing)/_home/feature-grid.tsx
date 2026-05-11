type Feature = {
  num: string;
  tag: string;
  head: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    num: "01",
    tag: "Drafting",
    head: "Pleadings, ready in minutes.",
    body: "Demand letters, affidavits of loss, NLRC position papers, motions for reconsideration, verified petitions. Five templates at launch — more in the queue.",
  },
  {
    num: "02",
    tag: "Q&A",
    head: "Answers with receipts.",
    body: "Every answer ships with the cases that support it. Click a citation to read the source decision in a side panel.",
  },
  {
    num: "03",
    tag: "Citations",
    head: "Real ones. Counted.",
    body: "No hallucinated G.R. numbers. Each output shows verified vs. unverified — and explains why a source did or didn't make it in.",
  },
];

export function FeatureGrid() {
  return (
    <section className="px-6 pt-14 pb-12 sm:px-10 sm:pt-20 sm:pb-16 lg:px-14 lg:pt-[88px] lg:pb-[72px]">
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-8 md:mb-10 gap-4 md:gap-8">
        <h2
          className="font-serif text-[32px] sm:text-[38px] lg:text-[44px] font-normal m-0 max-w-[520px]"
          style={{ letterSpacing: "-0.018em", lineHeight: 1.05 }}
        >
          Three things, done well.
        </h2>
        <p
          className="text-[13.5px] text-muted max-w-[320px] m-0"
          style={{ lineHeight: 1.5 }}
        >
          Every output is grounded in Philippine sources — Supreme Court
          decisions, Republic Acts, the 1987 Constitution.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-line md:border-b">
        {FEATURES.map((f, i) => (
          <article
            key={f.num}
            className={`px-6 sm:px-7 py-7 sm:py-8 ${
              i > 0 ? "border-t border-line md:border-t-0 md:border-l" : ""
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
