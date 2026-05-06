export function FounderNote() {
  return (
    <section style={{ padding: "0 56px 88px" }}>
      <div
        className="grid items-start border-t border-line pt-14"
        style={{ gridTemplateColumns: "1fr 2.4fr", gap: 56 }}
      >
        <div>
          <div className="w-16 h-16 bg-surface-alt border border-line rounded-full mb-[14px]" />
          <div className="font-serif text-[18px] font-medium">
            A note from the team.
          </div>
          <div className="text-[12px] text-muted font-mono tracking-[0.04em] mt-1">
            Manila · 2026
          </div>
        </div>
        <div
          className="font-serif text-[19px] text-ink-soft"
          style={{ lineHeight: 1.55, textWrap: "pretty" }}
        >
          We&apos;ve spent the last three years running a legal AI in
          Luxembourg. We learned the hard part isn&apos;t answering — it&apos;s
          drafting something a lawyer would actually file. Ponente is what
          we&apos;d build if we started over, for the practice we know best.
          <span className="block mt-[18px] font-sans text-[13.5px] text-muted">
            — The Ponente team
          </span>
        </div>
      </div>
    </section>
  );
}
