const TEMPLATES = [
  "Demand Letter",
  "Affidavit of Loss",
  "NLRC Position Paper",
  "Motion for Reconsideration",
  "Verified Petition",
  "More this quarter",
];

type Row = readonly [label: string, other: boolean | "~", ponente: boolean];

const ROWS: Row[] = [
  ["Q&A with citations", true, true],
  ["Verified PH-only sources", "~", true],
  ["Drafts demand letters", false, true],
  ["Drafts NLRC position papers", false, true],
  ["Export to .docx, edit-ready", false, true],
  ["Citation pill → source PDF", false, true],
];

function mark(value: boolean | "~"): string {
  if (value === true) return "✓";
  if (value === false) return "—";
  return "~";
}

export function DraftingDemo() {
  return (
    <section style={{ padding: "0 56px 88px" }}>
      <div
        className="bg-ink text-parchment grid items-center"
        style={{
          padding: "64px 56px",
          gridTemplateColumns: "1fr 1.1fr",
          gap: 56,
        }}
      >
        <div>
          <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-gold mb-[18px]">
            The wedge
          </div>
          <h2
            className="font-serif text-[44px] font-normal m-0 mb-[18px] text-parchment"
            style={{ lineHeight: 1.05, letterSpacing: "-0.018em" }}
          >
            Other tools answer.
            <br />
            <em className="italic text-gold">
              Ponente writes the document you file.
            </em>
          </h2>
          <p
            className="text-[16px] m-0 mb-7 max-w-[480px]"
            style={{
              lineHeight: 1.55,
              color: "rgba(245,239,226,0.78)",
            }}
          >
            Q&amp;A is the easy half. Drafting — turning facts into a verified,
            properly-cited pleading — is what lawyers actually deliver to
            clients. Five templates. Every line traceable.
          </p>
          <ul
            className="grid list-none m-0 p-0 text-[13.5px]"
            style={{
              gridTemplateColumns: "1fr 1fr",
              columnGap: 24,
              rowGap: 8,
              color: "rgba(245,239,226,0.85)",
            }}
          >
            {TEMPLATES.map((t, i) => {
              const placeholder = i === TEMPLATES.length - 1;
              return (
                <li
                  key={t}
                  className="flex items-center gap-2 py-[6px]"
                  style={{
                    borderTop:
                      i > 1 ? "1px solid rgba(245,239,226,0.1)" : undefined,
                  }}
                >
                  <span
                    className="block w-1 h-1 rounded-full"
                    style={{
                      background: placeholder
                        ? "var(--color-muted)"
                        : "var(--color-gold)",
                    }}
                  />
                  <span style={{ opacity: placeholder ? 0.6 : 1 }}>{t}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Comparison panel */}
        <div className="bg-surface-alt text-ink border border-gold">
          <div className="grid grid-cols-2 border-b border-line">
            <div className="px-[18px] py-[14px] text-[11px] tracking-[0.14em] uppercase font-mono text-muted border-r border-line">
              Other PH legal AI
            </div>
            <div className="px-[18px] py-[14px] text-[11px] tracking-[0.14em] uppercase font-mono text-accent font-semibold">
              Ponente
            </div>
          </div>
          {ROWS.map(([label, a, b], i) => (
            <div
              key={label}
              className={`grid grid-cols-2 ${
                i < ROWS.length - 1 ? "border-b border-line-soft" : ""
              }`}
            >
              <div className="px-[18px] py-3 text-[13.5px] text-ink-soft border-r border-line flex items-center justify-between">
                <span>{label}</span>
                <span
                  className="font-mono text-[14px]"
                  style={{
                    color:
                      a === true ? "var(--color-success)" : "var(--color-muted)",
                  }}
                >
                  {mark(a)}
                </span>
              </div>
              <div className="px-[18px] py-3 text-[13.5px] text-ink font-medium flex items-center justify-between">
                <span>{label}</span>
                <span
                  className="font-mono text-[14px]"
                  style={{
                    color: b ? "var(--color-success)" : "var(--color-muted)",
                  }}
                >
                  {mark(b)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
