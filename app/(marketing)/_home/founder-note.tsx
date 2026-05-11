export function FounderNote() {
  return (
    <section className="px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14 lg:pb-[88px]">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.4fr] items-start gap-8 lg:gap-14 border-t border-line pt-10 lg:pt-14">
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
          className="font-serif text-[17px] sm:text-[19px] text-ink-soft"
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
