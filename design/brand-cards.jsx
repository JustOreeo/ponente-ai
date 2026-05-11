// Brand-system cards: rationale, color, type, voice/do-don't, citation pill spec.
// Each card is a fixed-size artboard meant to be displayed inside DesignCanvas.

// ───────────────────────────────────────────────────────────────────
// BrandRationale — why "Ponente" wins
// ───────────────────────────────────────────────────────────────────
function BrandRationale({ theme }) {
  const p = theme.palette;
  const serif = theme.serif.stack;
  return (
    <div style={{ width: '100%', height: '100%', background: p.bg, color: p.ink, padding: '56px 64px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.muted, marginBottom: 28 }}>
        Naming · recommendation
      </div>
      <div style={{ fontFamily: serif, fontSize: 64, fontWeight: 400, lineHeight: 1.02, letterSpacing: '-0.02em', marginBottom: 8 }}>
        Lead with <em style={{ fontStyle: 'italic', color: p.accent }}>Ponente.</em>
      </div>
      <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 19, color: p.muted, marginBottom: 40, fontWeight: 300 }}>
        po·nén·te &nbsp;·&nbsp; <span style={{ fontStyle: 'normal' }}>n.</span> the justice who writes the decision.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px 48px', fontFamily: 'Inter', fontSize: 14.5, lineHeight: 1.55, color: p.inkSoft }}>
        <Reason p={p} num="01" head="Insider, not populist." body="Every PH lawyer knows the term — non-lawyers don't. That asymmetry is the brand: a tool built by people who've read the citations, for people who write them." />
        <Reason p={p} num="02" head="Names the act, not the field." body='"Batas" is the field (law). "Codigo" is the artifact (code). "Ponente" is the person doing the work — drafting an opinion. That maps directly to the wedge: drafting, not just answering.' />
        <Reason p={p} num="03" head="Premium without being precious." body="Two crisp syllables, hard consonants, no diacritics required for English keyboards. Reads as confident on a billboard and a contract footer." />
        <Reason p={p} num="04" head="Defensible." body='"Batas AI" is generic and crowded; "Codigo" collides with web-dev tooling. "Ponente" is a small, specific word with a clear meaning inside one professional community.' />
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingTop: 32, borderTop: `1px solid ${p.line}`, fontFamily: 'Inter', fontSize: 13, color: p.muted }}>
        <span style={{ fontWeight: 600, color: p.ink }}>Backups in slot:</span>
        <span><span style={{ color: p.ink }}>Batas AI</span> — if the audience widens to non-lawyers / law students.</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span><span style={{ color: p.ink }}>Codigo</span> — if you go regional (PH + LATAM).</span>
      </div>
    </div>
  );
}

function Reason({ p, num, head, body }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: p.accent, letterSpacing: '0.04em' }}>{num}</span>
        <span style={{ fontWeight: 600, color: p.ink, fontSize: 15.5 }}>{head}</span>
      </div>
      <div style={{ paddingLeft: 28, textWrap: 'pretty' }}>{body}</div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// PaletteCard — full palette with hex codes
// ───────────────────────────────────────────────────────────────────
function PaletteCard({ theme }) {
  const p = theme.palette;
  const serif = theme.serif.stack;

  const swatches = [
    { name: 'Parchment', role: 'bg', hex: p.bg, ink: p.ink },
    { name: 'Surface', role: 'surface', hex: p.surface, ink: p.ink },
    { name: 'Surface alt', role: 'surface-2', hex: p.surfaceAlt, ink: p.ink },
    { name: 'Court Navy', role: 'ink', hex: p.ink, ink: p.bg },
    { name: 'Ink soft', role: 'ink-2', hex: p.inkSoft, ink: p.bg },
    { name: 'Muted', role: 'muted', hex: p.muted, ink: p.bg },
    { name: 'Oxblood', role: 'accent', hex: p.accent, ink: p.bg },
    { name: 'Gold', role: 'gold', hex: p.gold, ink: p.bg },
  ];

  // Neutrals scale (10 stops) — generated relative to the parchment/navy axis.
  const stops = [
    '#FAF7EE','#F1ECE0','#E5DECB','#D9CFB8','#B8AE92',
    '#8A8067','#5C5444','#3F3A2E','#2A2620','#1A1714',
  ];
  const semantic = [
    { label: 'success', hex: '#3F6B4E' },
    { label: 'warning', hex: '#B8884A' },
    { label: 'error',   hex: '#A8332A' },
    { label: 'info',    hex: '#3A4A6B' },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: p.bg, color: p.ink, padding: '48px 56px', display: 'flex', flexDirection: 'column', fontFamily: 'Inter' }}>
      <CardEyebrow p={p}>Color · system</CardEyebrow>
      <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 400, letterSpacing: '-0.015em', marginBottom: 32 }}>
        Court &amp; library.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {swatches.map((s) => (
          <div key={s.name} style={{ background: s.hex, color: s.ink, height: 116, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: `1px solid ${p.line}` }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.name}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, opacity: 0.7, marginTop: 2 }}>${'{'+s.role+'}'}</div>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, opacity: 0.7, textTransform: 'uppercase' }}>{s.hex}</div>
          </div>
        ))}
      </div>

      <CardSubhead p={p}>Neutral scale · 10 stops</CardSubhead>
      <div style={{ display: 'flex', height: 56, marginBottom: 28, border: `1px solid ${p.line}` }}>
        {stops.map((hex, i) => (
          <div key={hex} style={{ flex: 1, background: hex, display: 'flex', alignItems: 'flex-end', padding: 6 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: i < 5 ? p.ink : p.bg, opacity: 0.8 }}>{(i + 1) * 100 - 50}</span>
          </div>
        ))}
      </div>

      <CardSubhead p={p}>Semantic</CardSubhead>
      <div style={{ display: 'flex', gap: 10 }}>
        {semantic.map((s) => (
          <div key={s.label} style={{ flex: 1, height: 60, background: s.hex, padding: '8px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#FAF7EE' }}>{s.label}</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, color: '#FAF7EE', opacity: 0.85, textTransform: 'uppercase' }}>{s.hex}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ borderTop: `1px solid ${p.line}`, paddingTop: 14, fontSize: 12, color: p.muted, lineHeight: 1.5 }}>
        Oxblood is reserved — it appears on no more than one element per screen. Court Navy is the workhorse; gold is for editorial moments only.
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// TypeCard — type system
// ───────────────────────────────────────────────────────────────────
function TypeCard({ theme }) {
  const p = theme.palette;
  const serif = theme.serif.stack;

  const Row = ({ label, sample, style }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'baseline', gap: 24, padding: '14px 0', borderBottom: `1px solid ${p.lineSoft}` }}>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, color: p.muted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color: p.ink, ...style }}>{sample}</div>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', background: p.bg, color: p.ink, padding: '48px 56px', display: 'flex', flexDirection: 'column', fontFamily: 'Inter' }}>
      <CardEyebrow p={p}>Typography · system</CardEyebrow>
      <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 400, letterSpacing: '-0.015em', marginBottom: 4 }}>
        Serif for tradition. Sans for clarity.
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 13.5, color: p.muted, marginBottom: 28, lineHeight: 1.5, maxWidth: 560 }}>
        {theme.serif.label} carries headlines, marketing, and any moment that needs the weight of the codal tradition. Inter does everything else — UI, body, dense reading.
      </div>

      <Row label="Display / 72" sample="Ponente" style={{ fontFamily: serif, fontSize: 72, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1 }} />
      <Row label="H1 / 44" sample="Drafts that cite their sources." style={{ fontFamily: serif, fontSize: 44, fontWeight: 400, letterSpacing: '-0.018em', lineHeight: 1.05 }} />
      <Row label="H2 / 28" sample="Republic Act No. 11232" style={{ fontFamily: serif, fontSize: 28, fontWeight: 500, letterSpacing: '-0.012em' }} />
      <Row label="H3 / 20" sample="Demand Letter — Section II" style={{ fontFamily: 'Inter', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' }} />
      <Row label="Body L / 17" sample={<span>The petitioner respectfully prays that this Honorable Court reconsider its <em style={{ color: p.accent, fontStyle: 'normal' }}>Resolution dated 14 January 2024</em>.</span>} style={{ fontFamily: 'Inter', fontSize: 17, fontWeight: 400, lineHeight: 1.55 }} />
      <Row label="Body / 14" sample="Plain-English UI text. No legalese in the product itself — lawyers use Ponente to escape it." style={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.55 }} />
      <Row label="Caption / 12" sample="Verify with the source decision before relying on this in pleadings." style={{ fontFamily: 'Inter', fontSize: 12, fontWeight: 500, color: p.muted, letterSpacing: '0.005em' }} />
      <Row label="Mono / 12" sample="G.R. No. 247429 · 11 Aug 2020" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: p.muted, letterSpacing: '0.01em' }} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// VoiceCard — tone do/don't
// ───────────────────────────────────────────────────────────────────
function VoiceCard({ theme }) {
  const p = theme.palette;
  const serif = theme.serif.stack;
  const dos = [
    ['Here are 4 sources for your question.', 'Confident. Counted. Specific.'],
    ['Drafted from your inputs. Edit before filing.', 'States what happened, what to do next.'],
    ['Cited 3 cases · 1 R.A. · 0 unverified.', 'Shows its math. Distinguishes verified from not.'],
    ['No matching decision. Try a broader query.', 'Says no, then offers a path forward.'],
  ];
  const donts = [
    ['I think this might possibly be relevant…', 'Apologetic. Hedged. Slow.'],
    ['Sparkle ✨ your pleadings with AI!', 'Consumer-app energy. Lawyers don\'t sparkle.'],
    ['Sorry, I am unable to fully understand…', 'Anthropomorphic apology. Just say what failed.'],
    ['Magical AI assistant for legal professionals', 'Marketing-deck filler. Says nothing.'],
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: p.bg, color: p.ink, padding: '48px 56px', fontFamily: 'Inter', display: 'flex', flexDirection: 'column' }}>
      <CardEyebrow p={p}>Voice · do &amp; don't</CardEyebrow>
      <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 400, letterSpacing: '-0.015em', marginBottom: 4 }}>
        Direct. Counted. Never apologetic.
      </div>
      <div style={{ fontSize: 13.5, color: p.muted, marginBottom: 28, lineHeight: 1.5, maxWidth: 560 }}>
        Lawyers use Ponente to escape legalese. The product itself doesn't speak it back.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, flex: 1 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3F6B4E', marginBottom: 14 }}>Do</div>
          {dos.map(([line, why]) => (
            <div key={line} style={{ borderLeft: `2px solid #3F6B4E`, paddingLeft: 14, marginBottom: 16 }}>
              <div style={{ fontFamily: serif, fontSize: 19, lineHeight: 1.3, color: p.ink, marginBottom: 4 }}>{line}</div>
              <div style={{ fontSize: 12.5, color: p.muted }}>{why}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.accent, marginBottom: 14 }}>Don't</div>
          {donts.map(([line, why]) => (
            <div key={line} style={{ borderLeft: `2px solid ${p.accent}`, paddingLeft: 14, marginBottom: 16 }}>
              <div style={{ fontFamily: serif, fontSize: 19, lineHeight: 1.3, color: p.ink, marginBottom: 4, opacity: 0.85, textDecoration: 'line-through', textDecorationColor: 'rgba(139,42,31,0.4)' }}>{line}</div>
              <div style={{ fontSize: 12.5, color: p.muted }}>{why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Small utilities used across cards
function CardEyebrow({ p, children }) {
  return (
    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.muted, marginBottom: 14 }}>
      {children}
    </div>
  );
}
function CardSubhead({ p, children }) {
  return (
    <div style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: p.ink, marginBottom: 12, marginTop: 4 }}>
      {children}
    </div>
  );
}

Object.assign(window, { BrandRationale, PaletteCard, TypeCard, VoiceCard, CardEyebrow, CardSubhead });
