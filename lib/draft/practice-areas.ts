/**
 * Canonical PH practice-area taxonomy. Used for chat filter chips and
 * legal_documents.practice_areas tags.
 *
 * The order is the order they appear in the chat filter UI.
 */

export const PRACTICE_AREAS = [
  { slug: "civil", label: "Civil" },
  { slug: "criminal", label: "Criminal" },
  { slug: "labor", label: "Labor" },
  { slug: "tax", label: "Tax" },
  { slug: "corporate", label: "Corporate" },
  { slug: "family", label: "Family" },
  { slug: "remedial", label: "Remedial" },
  { slug: "constitutional", label: "Constitutional" },
  { slug: "ip", label: "IP" },
  { slug: "admin", label: "Admin" },
  { slug: "election", label: "Election" },
  { slug: "mercantile", label: "Mercantile" },
  { slug: "legal_ethics", label: "Legal Ethics" },
] as const;

export type PracticeAreaSlug = (typeof PRACTICE_AREAS)[number]["slug"];

const VALID = new Set<string>(PRACTICE_AREAS.map((p) => p.slug));

/** Filter an arbitrary string array down to recognized practice-area slugs. */
export function sanitizePracticeAreas(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => VALID.has(s));
}
