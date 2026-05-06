const CITATIONS = [
  {
    tag: "Art. 1169",
    name: "Civil Code of the Philippines",
    meta: "Republic Act · verified",
  },
  {
    tag: "G.R. No. 196444",
    name: "Solid Homes v. Spouses Tan",
    meta: "2014 · 2nd Division",
  },
  {
    tag: "G.R. No. 175852",
    name: "Spouses Reyes v. BPI",
    meta: "2010 · En Banc",
  },
];

/**
 * Hero artifact — a drafting preview window with the document body on
 * the left and a citation panel on the right.
 */
export function DraftingPreview() {
  return (
    <div
      className="bg-surface border border-line relative"
      style={{ boxShadow: "0 24px 60px #1a243814, 0 1px 0 #fff inset" }}
    >
      {/* Doc header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-parchment">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted tracking-[0.06em]">
          <span className="w-[6px] h-[6px] rounded-full bg-accent" />
          DEMAND LETTER · v3 · drafting
        </div>
        <div className="flex gap-[6px]">
          <span className="font-mono text-[10px] px-2 py-[3px] bg-success text-parchment tracking-[0.08em]">
            3 SOURCES
          </span>
        </div>
      </div>

      <div
        className="grid min-h-[380px]"
        style={{ gridTemplateColumns: "1fr 0.55fr" }}
      >
        {/* Doc body */}
        <div className="px-8 py-7 border-r border-line font-serif text-[14px] leading-[1.65] text-ink">
          <div className="text-[11px] tracking-[0.14em] uppercase text-muted mb-2 font-sans">
            Re: Demand for Payment
          </div>
          <p className="m-0 mb-[10px]">
            <strong>Dear Mr. Tan,</strong>
          </p>
          <p className="m-0 mb-[10px]">
            This is a formal demand for the immediate payment of{" "}
            <strong>₱847,500.00</strong> representing unpaid services rendered
            under our Service Agreement dated 14 March 2024.
          </p>
          <p className="m-0 mb-[10px]">
            Under{" "}
            <span className="bg-surface-alt px-[6px] border border-line font-mono text-[11.5px]">
              Art. 1169, Civil Code
            </span>
            , your obligation became demandable upon the lapse of the agreed
            period. Continued non-payment constitutes mora solvendi.
          </p>
          <p className="m-0 mb-[10px] opacity-50">
            Failure to remit within fifteen (15) calendar days from receipt
            hereof shall compel us to pursue all available legal remedies,
            including the filing of…
          </p>
        </div>

        {/* Citations panel */}
        <div className="px-[18px] py-5 bg-parchment">
          <div className="text-[10.5px] tracking-[0.16em] uppercase text-muted mb-3 font-mono">
            Citations
          </div>
          {CITATIONS.map((c) => (
            <div
              key={c.tag}
              className="border-t border-line-soft py-3"
            >
              <div className="inline-flex items-center gap-[5px] bg-surface-alt border border-line px-2 py-[1px] font-mono text-[10.5px] text-ink mb-[6px]">
                <span className="w-1 h-1 rounded-full bg-accent" />
                {c.tag}
              </div>
              <div className="font-serif italic text-[12.5px] text-ink leading-[1.4]">
                {c.name}
              </div>
              <div className="text-[10.5px] text-muted font-mono mt-[2px]">
                {c.meta}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Doc footer */}
      <div className="px-4 py-[10px] border-t border-line bg-parchment flex items-center justify-between text-[11.5px]">
        <span className="text-muted italic">
          Verify with the source decision before relying on this in pleadings.
        </span>
        <span className="bg-ink text-parchment px-[10px] py-[5px] font-sans text-[11.5px] font-medium">
          Export .docx ↓
        </span>
      </div>
    </div>
  );
}
