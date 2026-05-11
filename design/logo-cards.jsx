// Logo concepts for Ponente. Three different marks + wordmark
// treatments. Each card shows: large mark, wordmark lockup, mono variants.

// Concept A — "The Pen Stroke" — initial P with a baybayin-inspired
// serif terminal that reads as a justice's signature stroke. Uses an
// enye-style tilde that doubles as the dot of an accent — subtle PH cue.
function LogoMarkPenStroke({ size = 88, color = '#1A2438', accent = '#8B2A1F' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      {/* P body — drawn as a heavy ink stroke */}
      <path d="M22 14 L22 78" stroke={color} strokeWidth="9" strokeLinecap="square"/>
      <path d="M22 14 L48 14 Q66 14 66 30 Q66 46 48 46 L22 46" stroke={color} strokeWidth="9" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
      {/* Signature flourish — exits the bowl like a justice's signature */}
      <path d="M48 46 Q60 50 72 64 Q76 70 78 78" stroke={accent} strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* Enye tilde — sits as accent over the P, not too cute */}
      <path d="M22 6 Q28 2 34 6 Q40 10 46 6" stroke={accent} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// Concept B — "The Codal Column" — a bracketed P built from a single
// constructed glyph that nods to indexed law codes (Article §, paragraph
// markers). Architectural, sober.
function LogoMarkColumn({ size = 88, color = '#1A2438', accent = '#8B2A1F' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      {/* Bracket frame */}
      <path d="M14 12 L14 76 L20 76" stroke={color} strokeWidth="2.5" fill="none"/>
      <path d="M74 12 L74 76 L68 76" stroke={color} strokeWidth="2.5" fill="none"/>
      <path d="M14 12 L20 12 M74 12 L68 12" stroke={color} strokeWidth="2.5" fill="none"/>
      {/* P glyph — geometric, slab */}
      <rect x="30" y="22" width="9" height="44" fill={color}/>
      <path d="M30 22 H52 a10 10 0 0 1 10 10 v4 a10 10 0 0 1 -10 10 H30" fill={color}/>
      {/* Section mark — single oxblood dot anchoring the base */}
      <circle cx="44" cy="72" r="3" fill={accent}/>
    </svg>
  );
}

// Concept C — "The Ponencia Seal" — a circular monogram with the P
// inside a thin ring, reminiscent of an apostille or court stamp. Most
// "official" feeling.
function LogoMarkSeal({ size = 88, color = '#1A2438', accent = '#8B2A1F' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <circle cx="44" cy="44" r="38" stroke={color} strokeWidth="1.5" fill="none"/>
      <circle cx="44" cy="44" r="32" stroke={color} strokeWidth="0.75" fill="none" strokeDasharray="2 2"/>
      {/* Serif P — drawn glyph, not a font, so it scales without webfont dep */}
      <path d="M30 24 L30 64 L36 64 L36 50 L46 50 Q57 50 57 41 Q57 32 46 32 L36 32 L36 24 Z M36 38 L36 44 L45 44 Q49 44 49 41 Q49 38 45 38 Z" fill={color}/>
      {/* Single tick mark */}
      <path d="M44 80 L44 84" stroke={accent} strokeWidth="2"/>
    </svg>
  );
}

// Wordmark — drawn in the chosen serif via CSS, with a small enye-style
// accent above the second letter as a baybayin nod.
function PonenteWordmark({ size = 56, color, serif, withAccent = true, name = 'Ponente' }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', fontFamily: serif, fontWeight: 400, fontSize: size, lineHeight: 1, color, letterSpacing: '-0.025em' }}>
      {name}
      {withAccent && (
        <svg width={size * 0.22} height={size * 0.12} viewBox="0 0 22 12" style={{ position: 'absolute', top: -size * 0.05, left: size * 0.18, color: 'currentColor' }}>
          <path d="M2 8 Q7 2 11 6 Q15 10 20 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55"/>
        </svg>
      )}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────
// LogoCard — one card per concept. Shows hero mark, wordmark lockup,
// mono inversions, and a one-line rationale.
// ───────────────────────────────────────────────────────────────────
function LogoCard({ theme, concept }) {
  const p = theme.palette;
  const serif = theme.serif.stack;
  const name = theme.name.word;

  const Mark = concept.Mark;
  return (
    <div style={{ width: '100%', height: '100%', background: p.bg, color: p.ink, padding: '40px 48px', display: 'flex', flexDirection: 'column', fontFamily: 'Inter' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.muted, marginBottom: 6 }}>{concept.code} · {concept.tagShort}</div>
          <div style={{ fontFamily: serif, fontSize: 30, fontWeight: 400, letterSpacing: '-0.012em' }}>{concept.title}</div>
        </div>
        <div style={{ fontSize: 12, color: p.muted, maxWidth: 220, textAlign: 'right', lineHeight: 1.45 }}>{concept.idea}</div>
      </div>

      {/* Hero block — large mark on parchment */}
      <div style={{ background: p.surface, border: `1px solid ${p.line}`, padding: '40px 32px', display: 'flex', alignItems: 'center', gap: 28, marginBottom: 20 }}>
        <Mark size={104} color={p.ink} accent={p.accent} />
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <PonenteWordmark size={56} color={p.ink} serif={serif} name={name} withAccent={concept.code === 'A'} />
          </div>
          <div style={{ fontSize: 12.5, color: p.muted, fontFamily: 'Inter' }}>
            Primary lockup · {concept.lockupNote}
          </div>
        </div>
      </div>

      {/* Mono variants */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        <Variant bg={p.bg} border={p.line} label="On parchment">
          <Mark size={44} color={p.ink} accent={p.ink} />
        </Variant>
        <Variant bg={p.ink} border={p.ink} label="On navy" labelColor={p.bg}>
          <Mark size={44} color={p.bg} accent={p.bg} />
        </Variant>
        <Variant bg={p.accent} border={p.accent} label="On accent" labelColor={p.bg}>
          <Mark size={44} color={p.bg} accent={p.bg} />
        </Variant>
      </div>

      {/* Favicon row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: p.muted, paddingTop: 14, borderTop: `1px solid ${p.lineSoft}` }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Favicon</span>
        <FaviconChip bg={p.surface} border={p.line}><Mark size={20} color={p.ink} accent={p.accent} /></FaviconChip>
        <FaviconChip bg={p.ink} border={p.ink}><Mark size={20} color={p.bg} accent={p.bg} /></FaviconChip>
        <FaviconChip bg={p.accent} border={p.accent}><Mark size={20} color={p.bg} accent={p.bg} /></FaviconChip>
        <span style={{ marginLeft: 'auto', textAlign: 'right', maxWidth: 280, lineHeight: 1.4 }}>{concept.notes}</span>
      </div>
    </div>
  );
}

function Variant({ bg, border, label, labelColor, children }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, height: 110, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: labelColor || 'rgba(0,0,0,0.55)', padding: '6px 10px', borderTop: `1px solid ${border === bg ? 'rgba(255,255,255,0.12)' : border}` }}>{label}</div>
    </div>
  );
}
function FaviconChip({ bg, border, children }) {
  return (
    <div style={{ width: 32, height: 32, background: bg, border: `1px solid ${border}`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
  );
}

// Concept descriptions
const LOGO_CONCEPTS = [
  {
    code: 'A',
    Mark: LogoMarkPenStroke,
    title: 'The Signature',
    tagShort: 'Pen-stroke P with enye',
    idea: 'A justice signs the decision. The mark IS that signature.',
    lockupNote: 'Wordmark uses the enye-style tilde as a subtle PH cue.',
    notes: 'Best for marketing — warm, hand-drawn, distinctly not generic SaaS.',
  },
  {
    code: 'B',
    Mark: LogoMarkColumn,
    title: 'The Codal Column',
    tagShort: 'Bracketed slab P',
    idea: 'Architecture of the law itself — articles, sections, paragraphs.',
    lockupNote: 'Bracket frame echoes statute formatting.',
    notes: 'Best for the app — geometric, scales down cleanly to 16px.',
  },
  {
    code: 'C',
    Mark: LogoMarkSeal,
    title: 'The Apostille',
    tagShort: 'Stamped seal monogram',
    idea: 'Court stamp meets monogram — most "official" reading.',
    lockupNote: 'Reserved for credentials, certificates, formal docs.',
    notes: 'Strongest for trust badges; risk is reading too institutional.',
  },
];

Object.assign(window, { LogoCard, LogoMarkPenStroke, LogoMarkColumn, LogoMarkSeal, PonenteWordmark, LOGO_CONCEPTS });
