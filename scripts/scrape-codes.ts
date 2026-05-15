/**
 * scripts/scrape-codes.ts
 *
 * Scrapes the 6 foundational Philippine codes from LawPhil.net (primary)
 * with Chan Robles fallback, and writes one chunked Markdown file per code
 * to `corpus/<slug>.md` in the format consumed by `scripts/ingest-codes.ts`.
 *
 * Run:
 *   npx tsx scripts/scrape-codes.ts                # all 6 codes
 *   npx tsx scripts/scrape-codes.ts civil_code     # one code by slug
 *
 * Output format (per file):
 *   ---
 *   slug: ...
 *   title: "..."
 *   doc_type: code|constitution
 *   source_url: "..."
 *   practice_areas: [a, b, c]
 *   effective_date: YYYY-MM-DD
 *   ---
 *
 *   ## Art. 1 — <optional caption>
 *   <article body>
 *
 *   ## Art. 2 — ...
 *
 * Chunking rule: one `## ` heading per article/section.
 * The heading includes the cite token verbatim ("Art. 1169", "Section 24")
 * so the citation prompt can match against it.
 *
 * Politeness: ~1.5s delay between fetches; descriptive User-Agent; one retry
 * on network error (no aggressive retry loop).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Code definitions
// ---------------------------------------------------------------------------

type DocType = "constitution" | "code";

type CodeSpec = {
  slug: string;
  title: string;
  doc_type: DocType;
  practice_areas: string[];
  effective_date: string;
  /** Cite prefix used in `## ` headings: "Art." | "Section" | "Sec." */
  citePrefix: string;
  /** "Article" or "Section" — the HTML keyword used by LawPhil for markers. */
  markerKeyword: "Article" | "Section";
  /**
   * LawPhil URLs in order. We concatenate the text of all pages before
   * splitting on the article marker (only used if a code is genuinely
   * split across files).
   */
  sources: { name: string; urls: string[] }[];
};

const CODES: CodeSpec[] = [
  {
    slug: "constitution_1987",
    title: "1987 Constitution of the Republic of the Philippines",
    doc_type: "constitution",
    practice_areas: ["constitutional"],
    effective_date: "1987-02-02",
    citePrefix: "Section",
    markerKeyword: "Section",
    sources: [
      {
        name: "lawphil",
        urls: ["https://lawphil.net/consti/cons1987.html"],
      },
      {
        name: "chanrobles",
        urls: [
          "https://www.chanrobles.com/article1.htm",
          "https://www.chanrobles.com/article2.htm",
        ],
      },
    ],
  },
  {
    slug: "civil_code",
    title: "Civil Code of the Philippines (R.A. No. 386)",
    doc_type: "code",
    practice_areas: ["civil", "family", "contracts", "obligations"],
    effective_date: "1950-08-30",
    citePrefix: "Art.",
    markerKeyword: "Article",
    sources: [
      {
        name: "lawphil",
        urls: ["https://lawphil.net/statutes/repacts/ra1949/ra_386_1949.html"],
      },
      {
        name: "chanrobles",
        urls: ["https://www.chanrobles.com/civilcodeofthephilippines.htm"],
      },
    ],
  },
  {
    slug: "revised_penal_code",
    title: "Revised Penal Code (Act No. 3815)",
    doc_type: "code",
    practice_areas: ["criminal"],
    effective_date: "1932-01-01",
    citePrefix: "Art.",
    markerKeyword: "Article",
    sources: [
      {
        name: "lawphil",
        urls: ["https://lawphil.net/statutes/acts/act1930/act_3815_1930.html"],
      },
      {
        name: "chanrobles",
        urls: [
          "https://www.chanrobles.com/revisedpenalcodeofthephilippinesbook1.htm",
        ],
      },
    ],
  },
  {
    slug: "labor_code",
    title: "Labor Code of the Philippines (P.D. No. 442, as amended)",
    doc_type: "code",
    practice_areas: ["labor"],
    effective_date: "1974-11-01",
    citePrefix: "Art.",
    markerKeyword: "Article",
    sources: [
      {
        name: "lawphil",
        urls: ["https://lawphil.net/statutes/presdecs/pd1974/pd_442_1974.html"],
      },
      {
        name: "chanrobles",
        urls: ["https://www.chanrobles.com/laborcodeofthephilippines.htm"],
      },
    ],
  },
  {
    slug: "nirc",
    title:
      "National Internal Revenue Code of 1997 (R.A. No. 8424, as amended)",
    doc_type: "code",
    practice_areas: ["tax"],
    effective_date: "1998-01-01",
    citePrefix: "Sec.",
    markerKeyword: "Section",
    sources: [
      {
        name: "lawphil",
        urls: ["https://lawphil.net/statutes/repacts/ra1997/ra_8424_1997.html"],
      },
      {
        name: "chanrobles",
        urls: ["https://www.chanrobles.com/republicactno8424.htm"],
      },
    ],
  },
  {
    slug: "family_code",
    title: "Family Code of the Philippines (E.O. No. 209)",
    doc_type: "code",
    practice_areas: ["family", "civil"],
    effective_date: "1988-08-03",
    citePrefix: "Art.",
    markerKeyword: "Article",
    sources: [
      {
        name: "lawphil",
        urls: ["https://lawphil.net/executive/execord/eo1987/eo_209_1987.html"],
      },
      {
        name: "chanrobles",
        urls: ["https://www.chanrobles.com/executiveorderno209.htm"],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Fetch with polite delay + simple retry
// ---------------------------------------------------------------------------

const USER_AGENT =
  "ponente-ai-corpus-scraper/1.0 (one-off; contact: corpus@ponente.ai)";
const DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function politeFetch(url: string): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      // LawPhil serves windows-1252 — decode accordingly.
      const buf = new Uint8Array(await res.arrayBuffer());
      // Try to detect charset from Content-Type, fall back to windows-1252.
      const ct = res.headers.get("content-type") ?? "";
      const charset = /charset=([^;]+)/i.exec(ct)?.[1]?.toLowerCase().trim();
      const enc = charset && charset !== "" ? charset : "windows-1252";
      try {
        return new TextDecoder(enc).decode(buf);
      } catch {
        return new TextDecoder("windows-1252").decode(buf);
      }
    } catch (err) {
      lastErr = err;
      if (attempt === 0) {
        await sleep(2000);
        continue;
      }
    }
  }
  throw new Error(
    `Failed to fetch ${url}: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}

// ---------------------------------------------------------------------------
// HTML → plain text
// ---------------------------------------------------------------------------

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, ent) => {
    if (ent[0] === "#") {
      const hex = ent[1] === "x" || ent[1] === "X";
      const code = parseInt(ent.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(code)) return m;
      try {
        return String.fromCodePoint(code);
      } catch {
        return m;
      }
    }
    return HTML_ENTITIES[ent] ?? m;
  });
}

/**
 * Pre-process HTML: locate every `<b>Article N.</b>` / `<b>Section N.</b>`
 * (or the SEC./ART. variants) and an optional following `<i>caption</i>`,
 * and replace the whole construct with a sentinel line:
 *
 *   §§MARK§§|<keyword>|<number>|<caption>§§
 *
 * Splitting on this sentinel later is far more reliable than trying to
 * match "Article 1." in plain text, because (a) cross-references like
 * "violation of Article 5" inside a body would otherwise be mistaken for
 * markers, (b) LawPhil sources have occasional typos like "Article. 8."
 * with a stray period, and (c) we cleanly capture the italic caption
 * before HTML stripping discards the <i> grouping.
 */
function injectMarkers(html: string, keyword: "Article" | "Section"): string {
  const altShort = keyword === "Section" ? "SEC" : "ART";
  // Match the marker in a few forms:
  //   <b>Article 1.</b>
  //   <b>Article. 8.</b>      (typo)
  //   <b>SEC. 254.</b>        (NIRC body)
  //   <b>Section 24.</b> <i>Income Tax Rates.</i>
  // Then optionally consume an italic caption that follows immediately.
  const re = new RegExp(
    `<b\\s*>\\s*(?:${keyword}|${keyword.toUpperCase()}|${altShort})\\.?\\s*(\\d+)\\s*\\.?\\s*</b\\s*>` +
      `(?:\\s*<i\\s*>([\\s\\S]{0,400}?)</[iI]\\s*>)?`,
    "g",
  );
  return html.replace(re, (_full, numStr: string, capRaw?: string) => {
    const num = numStr.trim();
    let caption = "";
    if (capRaw) {
      caption = decodeEntities(capRaw.replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim()
        .replace(/[.\-–—\s]+$/g, "")
        .trim();
    }
    return `\n§§MARK§§|${keyword}|${num}|${caption}§§\n`;
  });
}

function htmlToText(html: string): string {
  // 1. Trim to the LawPhil body — start at the first <blockquote> (which
  //    follows the navigation header) and end at the trailing
  //    "The Lawphil Project" footer link. This drops top-of-page nav,
  //    search box, ads, and bottom navigation arrows.
  let body = html;
  const bqStart = body.search(/<blockquote\b[^>]*>/i);
  if (bqStart !== -1) body = body.slice(bqStart);
  const footerIdx = body.search(
    /<a[^>]+class\s*=\s*["']?id["']?[^>]*>\s*The\s*Lawphil\s*Project/i,
  );
  if (footerIdx !== -1) body = body.slice(0, footerIdx);

  // 2. Drop <script>, <style>, <head>, comment blocks.
  body = body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<head\b[\s\S]*?<\/head>/gi, "");

  // 2a. Drop <p> blocks whose primary content is a TOC anchor link
  //     (href="#anchor"). The NIRC has a clickable table-of-contents
  //     before the body whose entries are <p>…<a href="#tN">…</a></p>;
  //     we'd otherwise inline the whole TOC into the enacting clause.
  //
  //     Tight pattern: the <p> must not contain any further <p> tags
  //     inside it, to avoid swallowing the entire document body when
  //     LawPhil ships malformed unclosed <p>s (a hazard on the Civil
  //     Code, whose footnotes use anchor-only links).
  body = body.replace(
    /<p\b[^>]*>(?:(?!<\/?p\b)[\s\S])*?<a\b[^>]*\bhref\s*=\s*["']#[^"']*["'][^<]*<\/a\s*>(?:(?!<\/?p\b)[\s\S])*?<\/p\s*>/gi,
    "\n",
  );

  // 3. Block-level tags → newline. The constitution and RPC use various
  //    layouts (<p>, <div>, <dir>, <ol>, <li>, <br>, <hr>, <h1..h6>,
  //    <blockquote>, <table>/<tr>/<td>). Insert newlines so we don't
  //    glue consecutive blocks together.
  const BLOCK_OPEN =
    /<\/?(?:p|div|dir|ol|ul|li|br|hr|h[1-6]|blockquote|table|tr|td|th|tbody|thead|center|article|section)\b[^>]*>/gi;
  body = body.replace(BLOCK_OPEN, "\n");

  // 4. Strip remaining tags.
  body = body.replace(/<[^>]+>/g, "");

  // 5. Decode HTML entities (after stripping so we don't accidentally
  //    re-introduce "<" or ">" that match a tag pattern).
  body = decodeEntities(body);

  // 6. Normalise whitespace.
  //    - Collapse runs of tabs/spaces.
  //    - Trim trailing whitespace on each line.
  //    - Collapse 3+ newlines to 2.
  body = body
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  // 7. Drop known navigation cruft lines that survive the strip.
  const NAV_PATTERNS: RegExp[] = [
    /^Back to (Main|Top)/i,
    /^Top of Page/i,
    /^The Lawphil Project/i,
    /^All Rights Reserved/i,
    /^Arellano Law Foundation/i,
    /^Search\s*$/i,
    /^Home\s*$/i,
  ];
  body = body
    .split("\n")
    .filter((l) => !NAV_PATTERNS.some((re) => re.test(l)))
    .join("\n");

  return body.trim();
}

// ---------------------------------------------------------------------------
// Splitter
// ---------------------------------------------------------------------------

type Chunk = { num: number; heading: string; body: string };

const SENTINEL_RE = /§§MARK§§\|(Article|Section)\|(\d+)\|([^§]*)§§/g;

/**
 * Second-pass injection: catch article/section markers that weren't wrapped
 * in `<b>...</b>` in the source HTML (e.g. LawPhil's Family Code has the
 * typo "Article. 8." with no bold). Works on the already-stripped plain
 * text, looking for line-starting marker patterns NOT already part of a
 * sentinel line. We DO NOT touch lines that already contain "§§MARK§§"
 * (those were handled by injectMarkers).
 *
 * Conservative: only matches when the marker starts a line (after newline
 * or at start-of-text), to avoid mistaking cross-references like "see
 * Article 35" inside a body paragraph for chunk boundaries.
 */
function injectOrphanMarkers(
  text: string,
  keyword: "Article" | "Section",
): string {
  const altShort = keyword === "Section" ? "SEC" : "ART";
  // The marker must start the line (^), be the keyword with optional period,
  // a number, and a final period — followed by some body content (not just
  // a number, to avoid catching "Article 8. above" inside cross-refs that
  // happen to start a line).
  const re = new RegExp(
    `^(?:${keyword}|${keyword.toUpperCase()}|${altShort})\\.?\\s+(\\d+)\\.\\s+(?=[A-Z(])`,
    "gm",
  );
  return text.replace(re, (_full, numStr: string) => {
    return `\n§§MARK§§|${keyword}|${numStr.trim()}|§§\n`;
  });
}

/**
 * Split the plain text (already containing §§MARK§§ sentinels injected
 * by injectMarkers() before HTML stripping) into per-article chunks.
 *
 * The text BEFORE the first sentinel is the preamble + TOC, discarded.
 *
 *   citePrefix     "Art." | "Sec." | "Section"
 *   markerKeyword  the keyword to recognise in sentinels (Article|Section)
 *
 * Caption-handling: an empty captured caption produces a bare heading
 * like "## Art. 14". A non-empty caption produces "## Art. 14 — Status".
 */
function splitBySentinel(
  text: string,
  citePrefix: string,
  markerKeyword: "Article" | "Section",
): Chunk[] {
  SENTINEL_RE.lastIndex = 0;
  const matches: { start: number; end: number; num: number; caption: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = SENTINEL_RE.exec(text)) !== null) {
    if (m[1] !== markerKeyword) continue;
    matches.push({
      start: m.index,
      end: SENTINEL_RE.lastIndex,
      num: parseInt(m[2], 10),
      caption: sanitiseCaption(m[3]),
    });
  }
  if (matches.length === 0) return [];

  const chunks: Chunk[] = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    // Body starts AFTER the sentinel.
    let body = text.slice(cur.end, next ? next.start : text.length).trim();
    // Strip a leading "- " / "– " / "— " that LawPhil places between the
    // italic caption and the substantive text (we already consumed the
    // caption into the sentinel).
    body = body.replace(/^[\s]*[-–—]\s*/, "");
    if (!body) continue;

    const heading =
      cur.caption.length > 0
        ? `${citePrefix} ${cur.num} — ${cur.caption}`
        : `${citePrefix} ${cur.num}`;
    chunks.push({ num: cur.num, heading, body });
  }
  return chunks;
}

function sanitiseCaption(raw: string): string {
  let c = raw.replace(/\s+/g, " ").trim();
  // Drop runaway captions — anything > 90 chars is almost certainly mis-
  // captured body text (caption italics on LawPhil are typically <50 chars).
  if (c.length > 90) return "";
  // Strip trailing dash/period whitespace.
  c = c.replace(/[.\-–—\s]+$/g, "").trim();
  return c;
}

/**
 * The 1987 Constitution is structured as ARTICLE I..XVIII (roman),
 * each containing Section 1..N. We want each section to be one chunk,
 * with the heading carrying the article number for context, e.g.:
 *   ## Art. III, Sec. 1
 *
 * Article I has no sections (a single paragraph defining national
 * territory) and gets a single chunk. The Preamble is its own chunk.
 *
 * Like the codes, the text already has §§MARK§§ sentinels at every
 * `<b>Section N.</b>` injected during HTML preprocessing. We walk the
 * plain text, identify "ARTICLE <roman>" header lines, and then split
 * each article-region on §§MARK§§ sentinels.
 */
function splitConstitution(text: string): Chunk[] {
  const chunks: Chunk[] = [];

  // Truncate the doc at the start of the appended ORDINANCE (apportionment
  // of House seats) and at the "Adopted:" signature block — those are
  // appendices/signatures, not constitutional sections, but the section-
  // marker sentinels inside them would otherwise be mis-labeled as
  // Art. XVIII sections.
  const ordIdx = text.search(/^ORDINANCE\b/m);
  if (ordIdx !== -1) text = text.slice(0, ordIdx);
  const adoptedIdx = text.search(/^Adopted:\s*$/m);
  if (adoptedIdx !== -1) text = text.slice(0, adoptedIdx);

  // Find article-block start positions on the plain text.
  const articleRe = /^ARTICLE\s+([IVXL]+)\b/gm;
  const articleStarts: { start: number; end: number; roman: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = articleRe.exec(text)) !== null) {
    articleStarts.push({ start: m.index, end: articleRe.lastIndex, roman: m[1] });
  }
  if (articleStarts.length === 0) {
    // Defensive — fall back to flat section split.
    return splitBySentinel(text, "Section", "Section");
  }

  // Preamble: everything between "PREAMBLE" and the first ARTICLE.
  const preambleSlice = text.slice(0, articleStarts[0].start);
  const preambleStart = preambleSlice.search(/^PREAMBLE\b/m);
  if (preambleStart !== -1) {
    const preamble = preambleSlice.slice(preambleStart).replace(/^PREAMBLE\s*/, "").trim();
    if (preamble.length > 50) {
      chunks.push({ num: 0, heading: "Preamble", body: preamble });
    }
  }

  // For each article-region: pull sections via §§MARK§§ sentinels.
  for (let i = 0; i < articleStarts.length; i++) {
    const cur = articleStarts[i];
    const next = articleStarts[i + 1];
    const region = text.slice(cur.start, next ? next.start : text.length);

    // Region's first line is "ARTICLE <roman>" plus optional title on next
    // line(s). We'll keep things simple and just use the roman in headings.
    const roman = cur.roman;

    // Within the region, find all section sentinels.
    SENTINEL_RE.lastIndex = 0;
    const sectMatches: { start: number; end: number; num: number }[] = [];
    let sm: RegExpExecArray | null;
    while ((sm = SENTINEL_RE.exec(region)) !== null) {
      if (sm[1] !== "Section") continue;
      sectMatches.push({
        start: sm.index,
        end: SENTINEL_RE.lastIndex,
        num: parseInt(sm[2], 10),
      });
    }

    if (sectMatches.length === 0) {
      // No sections — the whole article body becomes one chunk
      // (e.g. ARTICLE I — National Territory).
      const body = region
        .replace(/^ARTICLE\s+[IVXL]+\s*\n?[^\n]*\n?/, "")
        .trim();
      if (body.length > 30) {
        chunks.push({ num: 0, heading: `Art. ${roman}`, body });
      }
      continue;
    }

    for (let j = 0; j < sectMatches.length; j++) {
      const sc = sectMatches[j];
      const nx = sectMatches[j + 1];
      const slice = region.slice(sc.end, nx ? nx.start : region.length).trim();
      if (!slice) continue;
      chunks.push({
        num: sc.num,
        heading: `Art. ${roman}, Sec. ${sc.num}`,
        body: slice,
      });
    }
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function renderMarkdown(spec: CodeSpec, sourceUrl: string, chunks: Chunk[]): string {
  const fm = [
    "---",
    `slug: ${spec.slug}`,
    `title: "${spec.title.replace(/"/g, '\\"')}"`,
    `doc_type: ${spec.doc_type}`,
    `source_url: "${sourceUrl}"`,
    `practice_areas: [${spec.practice_areas.join(", ")}]`,
    `effective_date: ${spec.effective_date}`,
    "---",
    "",
  ].join("\n");

  const sections = chunks.map((c) => {
    // Ensure the heading line and the body don't duplicate the heading text.
    const bodyTrimmed = c.body.startsWith(c.heading)
      ? c.body.slice(c.heading.length).replace(/^\n+/, "")
      : c.body;
    return `## ${c.heading}\n\n${bodyTrimmed}\n`;
  });

  return fm + "\n" + sections.join("\n");
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

async function scrapeCode(spec: CodeSpec): Promise<{
  outPath: string;
  sourceUsed: string;
  urlUsed: string;
  chunkCount: number;
  bytes: number;
}> {
  let lastErr: unknown;
  for (const src of spec.sources) {
    try {
      // Fetch all URLs for this source, inject sentinels, then strip HTML.
      const texts: string[] = [];
      const usedUrls: string[] = [];
      for (const url of src.urls) {
        const html = await politeFetch(url);
        const withMarkers = injectMarkers(html, spec.markerKeyword);
        let text = htmlToText(withMarkers);
        // Second pass: catch typo'd markers that weren't wrapped in <b>...</b>
        // in the source HTML (e.g. Family Code's "Article. 8.").
        text = injectOrphanMarkers(text, spec.markerKeyword);
        texts.push(text);
        usedUrls.push(url);
        await sleep(DELAY_MS);
      }
      const combined = texts.join("\n\n");

      let chunks: Chunk[];
      if (spec.slug === "constitution_1987") {
        chunks = splitConstitution(combined);
      } else {
        chunks = splitBySentinel(combined, spec.citePrefix, spec.markerKeyword);
      }

      if (chunks.length < 50) {
        throw new Error(
          `Too few chunks (${chunks.length}) from ${src.name}; likely a parse failure.`,
        );
      }

      // Sanity: drop pathological 1-line chunks (likely TOC residue).
      chunks = chunks.filter((c) => c.body.length > 30);
      // Sanity: deduplicate by (num, first 40 chars of body). LawPhil
      // sometimes repeats a TOC link inside the body — we already strip
      // TOC by ignoring text before the first marker, but defensive dedup
      // catches "Article 1. ..." references in cross-citations.
      const seen = new Set<string>();
      chunks = chunks.filter((c) => {
        const k = `${c.num}::${c.body.slice(0, 40)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      const md = renderMarkdown(spec, usedUrls[0], chunks);
      const outPath = join(process.cwd(), "corpus", `${spec.slug}.md`);
      await writeFile(outPath, md, "utf8");
      return {
        outPath,
        sourceUsed: src.name,
        urlUsed: usedUrls[0],
        chunkCount: chunks.length,
        bytes: Buffer.byteLength(md, "utf8"),
      };
    } catch (err) {
      lastErr = err;
      console.warn(
        `  [${spec.slug}] ${src.name} failed: ${err instanceof Error ? err.message : err}; trying next source`,
      );
    }
  }
  throw new Error(
    `[${spec.slug}] all sources failed. Last error: ${lastErr instanceof Error ? lastErr.message : lastErr}`,
  );
}

async function main() {
  const arg = process.argv[2];
  const targets = arg ? CODES.filter((c) => c.slug === arg) : CODES;
  if (targets.length === 0) {
    console.error(`No code matches slug "${arg}".`);
    process.exit(1);
  }

  await mkdir(join(process.cwd(), "corpus"), { recursive: true });

  const results: Awaited<ReturnType<typeof scrapeCode>>[] = [];
  for (const spec of targets) {
    console.log(`\n=== ${spec.slug} ===`);
    try {
      const r = await scrapeCode(spec);
      console.log(
        `  wrote ${r.outPath}\n  source=${r.sourceUsed}  url=${r.urlUsed}\n  chunks=${r.chunkCount}  bytes=${r.bytes}`,
      );
      results.push(r);
    } catch (err) {
      console.error(`  FAILED: ${err instanceof Error ? err.message : err}`);
      process.exitCode = 1;
    }
  }

  console.log("\n=== summary ===");
  for (const r of results) {
    console.log(
      `${r.outPath.padEnd(60)}  ${r.sourceUsed.padEnd(10)} chunks=${r.chunkCount.toString().padStart(5)}  bytes=${r.bytes}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
