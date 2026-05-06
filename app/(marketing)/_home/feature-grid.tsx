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
    <section style={{ padding: "88px 56px 72px" }}>
      <div className="flex items-baseline justify-between mb-10">
        <h2
          className="font-serif text-[44px] font-normal m-0 max-w-[520px]"
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
      <div className="grid grid-cols-3 border-t border-b border-line">
        {FEATURES.map((f, i) => (
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
