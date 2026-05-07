import type { ReactNode } from "react";
import { CitationPill } from "@/components/citation-pill";

/**
 * Render a string that may contain `[[tag]]` markers — replacing each with a
 * <CitationPill>. Splits on \n\n into paragraphs.
 *
 * Used for both chat assistant messages and streamed draft bodies.
 */
export function renderWithCitations(text: string): ReactNode {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, i) => (
    <p key={i} className="m-0 mb-3 last:mb-0">
      {renderParagraph(para)}
    </p>
  ));
}

function renderParagraph(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\[\[(.+?)\]\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(renderInline(text.slice(last, match.index), key++));
    }
    parts.push(<CitationPill key={`c-${key++}`}>{match[1]}</CitationPill>);
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
