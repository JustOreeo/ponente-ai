import "server-only";
import {
  Document,
  Footer,
  HeadingLevel,
  PageNumber,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

/**
 * Convert the streamed draft body (markdown-ish: paragraphs separated by
 * \n\n, **bold** spans, [[citation]] markers) into a Word .docx Buffer
 * suitable for `Content-Disposition: attachment`.
 */
export async function bodyToDocxBuffer(opts: {
  title: string;
  body: string;
  template: string;
}): Promise<Buffer> {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: opts.title.toUpperCase(),
          bold: true,
          size: 28,
        }),
      ],
    }),
  );

  // Body — split on blank lines, render each chunk
  const blocks = opts.body.split(/\n\n+/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: parseInline(trimmed),
      }),
    );
  }

  // Disclaimer footer paragraph
  paragraphs.push(
    new Paragraph({
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: "Drafted with Ponente. Verify every cited source before relying on this in pleadings.",
          italics: true,
          size: 18,
          color: "6B6357",
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: "Ponente",
    title: opts.title,
    description: `Drafted via Ponente · ${opts.template} template`,
    styles: {
      default: {
        document: {
          run: { font: "Source Serif 4", size: 24 }, // 12pt
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ["Page ", PageNumber.CURRENT],
                    size: 18,
                    color: "9CA3AF",
                  }),
                ],
              }),
            ],
          }),
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Parse a single paragraph into TextRun[] handling **bold** and [[citation]].
 * Citations render as bracketed inline mono text — Word doesn't have a real
 * "pill" primitive but [Art. 1169, Civil Code] reads as a citation tag.
 */
function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = [];
  // Tokenize on **bold** and [[citation]] boundaries; everything else is plain.
  const regex = /(\*\*.+?\*\*)|(\[\[.+?\]\])/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      runs.push(new TextRun({ text: text.slice(last, match.index) }));
    }
    const [token] = match;
    if (token.startsWith("**")) {
      runs.push(
        new TextRun({ text: token.slice(2, -2), bold: true }),
      );
    } else if (token.startsWith("[[")) {
      runs.push(
        new TextRun({
          text: `[${token.slice(2, -2)}]`,
          font: "IBM Plex Mono",
          color: "8B2A1F",
        }),
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last) }));
  }
  return runs.length > 0 ? runs : [new TextRun({ text })];
}
