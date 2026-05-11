// Tokens shared across every card. Read TWEAKS off window so individual
// cards can render against whatever the user has set in the panel.

const PALETTES = {
  library: {
    label: 'Library (parchment + navy + oxblood)',
    bg: '#F5EFE2',          // parchment cream
    surface: '#FAF7EE',
    surfaceAlt: '#EDE6D5',
    ink: '#1A2438',         // courtroom navy
    inkSoft: '#3A4A6B',
    muted: '#6B6357',
    line: '#D9CFB8',
    lineSoft: '#E5DCC6',
    accent: '#8B2A1F',      // oxblood / flag-red restrained
    accentInk: '#FAF7EE',
    gold: '#A8884A',
  },
  navy: {
    label: 'Court (navy-dominant + parchment + flag-red)',
    bg: '#0E1B2C',
    surface: '#16263C',
    surfaceAlt: '#1F3148',
    ink: '#F5EFE2',
    inkSoft: '#D9CFB8',
    muted: '#9AA4B2',
    line: '#243957',
    lineSoft: '#1B2A40',
    accent: '#B8332A',
    accentInk: '#F5EFE2',
    gold: '#C9A961',
  },
  ivory: {
    label: 'Ivory (off-white + ink black)',
    bg: '#FAF8F3',
    surface: '#FFFFFF',
    surfaceAlt: '#F1ECE0',
    ink: '#1F2937',
    inkSoft: '#374151',
    muted: '#9CA3AF',
    line: '#E5DECB',
    lineSoft: '#EFE9D9',
    accent: '#1F2937',
    accentInk: '#FAF8F3',
    gold: '#8B6F2F',
  },
  bloomberg: {
    label: 'Terminal (near-black + warm gold)',
    bg: '#0A0A0A',
    surface: '#161514',
    surfaceAlt: '#1F1D1A',
    ink: '#FAFAFA',
    inkSoft: '#E5E5E5',
    muted: '#737373',
    line: '#2A2724',
    lineSoft: '#1F1D1A',
    accent: '#C9A961',
    accentInk: '#0A0A0A',
    gold: '#C9A961',
  },
};

const SERIFS = {
  source: { label: 'Source Serif 4', stack: '"Source Serif 4", "Source Serif Pro", Georgia, serif' },
  newsreader: { label: 'Newsreader', stack: '"Newsreader", "Source Serif 4", Georgia, serif' },
  fraunces: { label: 'Fraunces', stack: '"Fraunces", "Source Serif 4", Georgia, serif' },
  garamond: { label: 'EB Garamond', stack: '"EB Garamond", "Source Serif 4", Georgia, serif' },
};

const NAMES = {
  ponente: { word: 'Ponente', tagline: 'The legal AI that drafts, not just answers.' },
  batas: { word: 'Batas', tagline: 'The legal AI that drafts, not just answers.' },
  codigo: { word: 'Codigo', tagline: 'The legal AI that drafts, not just answers.' },
};

// Default tweak values — JSON-only, between markers so the host can persist.
window.PONENTE_DEFAULTS = /*EDITMODE-BEGIN*/{
  "name": "ponente",
  "palette": "library",
  "serif": "source",
  "showLogos": true,
  "showHomepage": true
}/*EDITMODE-END*/;

window.PALETTES = PALETTES;
window.SERIFS = SERIFS;
window.NAMES = NAMES;

// Helper used by cards to resolve current theme.
window.resolveTheme = function(tw) {
  const palette = PALETTES[tw.palette] || PALETTES.library;
  const serif = SERIFS[tw.serif] || SERIFS.source;
  const name = NAMES[tw.name] || NAMES.ponente;
  return { palette, serif, name };
};
