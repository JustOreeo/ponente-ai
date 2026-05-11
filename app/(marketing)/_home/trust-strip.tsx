type Quote = {
  who: string;
  where: string;
  line: string;
};

const QUOTES: Quote[] = [
  {
    who: "Atty. Maria Reyes",
    where: "Solo · Quezon City",
    line: "It drafted a position paper in eight minutes that I would have spent the afternoon on. Every citation checked out.",
  },
  {
    who: "Atty. Joaquin Cruz",
    where: "Cruz & Partners · Makati",
    line: "The drafting is the difference. I've tried the Q&A tools — they save research, not work.",
  },
  {
    who: "Atty. Lia Santos",
    where: "In-house · BGC",
    line: "The citation panel is the part I trust. Click any case, see the actual decision.",
  },
];

export function TrustStrip() {
  return (
    <section className="border-t border-b border-line-soft bg-surface px-6 sm:px-10 lg:px-14 pt-5 pb-9">
      <div className="text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4 font-mono">
        Used by lawyers at
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {QUOTES.map((q) => (
          <figure key={q.who} className="m-0">
            <blockquote
              className="font-serif text-[15px] sm:text-[16px] italic text-ink leading-[1.45] mb-3 m-0"
              style={{ textWrap: "pretty" }}
            >
              &ldquo;{q.line}&rdquo;
            </blockquote>
            <figcaption>
              <div className="text-[12px] text-ink font-semibold">{q.who}</div>
              <div className="text-[11.5px] text-muted">{q.where}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
