import type { ReactNode } from "react";
import { CitationPill } from "@/components/citation-pill";
import type { Citation } from "@/lib/ai/events";

/**
 * Render a string that may contain `[[tag]]` markers — replacing each with a
 * <CitationPill>. Splits on \n\n into paragraphs.
 *
 * If a `citationMap` is supplied (built from the streamed citation events),
 * each pill picks up its verified/unverified status from the map. Tags not
 * in the map render as verified (legacy default for static marketing copy).
 */
export function renderWithCitations(
  text: string,
  citationMap?: Map<string, Citation>,
  onCitationClick?: (citation: Citation) => void,
): ReactNode {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => (
    <p key={i} className="m-0 mb-3 last:mb-0">
      {renderParagraph(para, citationMap, onCitationClick)}
    </p>
  ));
}

function renderParagraph(
  text: string,
  citationMap?: Map<string, Citation>,
  onCitationClick?: (citation: Citation) => void,
): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\[\[(.+?)\]\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(renderInline(text.slice(last, match.index), key++));
    }
    const tag = match[1];
    const citation = citationMap?.get(tag);
    parts.push(
      <CitationPill
        key={`c-${key++}`}
        status={citation?.status ?? "verified"}
        onClick={citation && onCitationClick ? () => onCitationClick(citation) : undefined}
        title={citation ? `${citation.name} · ${citation.meta}` : undefined}
      >
        {tag}
      </CitationPill>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(renderInline(text.slice(last), key++));
  }
  return parts;
}

/** Render inline markdown-ish: **bold** and the rest as plain text. */
function renderInline(text: string, baseKey: number): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    parts.push(<strong key={`b-${baseKey}-${key++}`}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return <span key={`s-${baseKey}`}>{parts}</span>;
}
