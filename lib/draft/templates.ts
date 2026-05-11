/**
 * Drafting template registry. The 5 Phase 2 MVP templates: each defines
 * its form schema (fields the user fills in) and metadata. The Anthropic
 * adapter at lib/ai/anthropic.ts maps `apiKey` strings to its drafting
 * prompt and retrieval logic.
 *
 * Adding a new template:
 *   1. Add an entry below
 *   2. Add the apiKey to ALLOWED_TEMPLATES in app/api/draft/route.ts
 *   3. Add the apiKey + name to TEMPLATE_NAMES in lib/ai/anthropic.ts
 *   4. (Lawyer review) confirm the system prompt produces a sound draft
 */

export type FieldType = "text" | "textarea" | "select";

export type TemplateField = {
  key: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  /** When true, the form blocks generation until this is filled. */
  required?: boolean;
  /** Options for select fields. */
  options?: string[];
  /** Optional helper text shown below the field. */
  helper?: string;
  /** Default value (e.g., a sensible boilerplate phrase). */
  default?: string;
  /** Number of rows for textarea fields. Default 3. */
  rows?: number;
};

export type Template = {
  /** URL slug — also used in nav. /draft/<slug>. */
  slug: string;
  /** API string passed to /api/draft. Must match ALLOWED_TEMPLATES. */
  apiKey: "demand" | "affidavit" | "nlrc" | "mr" | "petition";
  /** T01..T05 — used in UI eyebrow labels. */
  code: string;
  /** Human-readable template name. */
  name: string;
  /** One-line blurb for picker cards. */
  blurb: string;
  /** Practice-area tags — also used to scope retrieval. */
  practiceAreas: string[];
  /** Time estimate for the picker card. */
  estimatedMinutes: string;
  /** Form schema. */
  fields: TemplateField[];
};

export const TEMPLATES: Template[] = [
  {
    slug: "demand",
    apiKey: "demand",
    code: "T01",
    name: "Demand Letter",
    blurb:
      "Formal demand for payment, performance, or vacation of premises.",
    practiceAreas: ["civil", "obligations"],
    estimatedMinutes: "~8 min",
    fields: [
      {
        key: "demanding_party",
        label: "Demanding party",
        placeholder: "Reyes Law Office, on behalf of GoCloud Inc.",
        type: "text",
        required: true,
      },
      {
        key: "recipient",
        label: "Recipient",
        placeholder: "Mr. Edgardo Tan · Globe Telecom Subscriber",
        type: "text",
        required: true,
      },
      {
        key: "obligation",
        label: "Obligation owed",
        placeholder:
          "Unpaid services rendered under SLA dated 14 Mar 2024",
        type: "textarea",
        required: true,
        rows: 3,
      },
      {
        key: "amount",
        label: "Amount demanded",
        placeholder: "₱847,500.00",
        type: "text",
        required: true,
        helper: "Include peso sign and exact figure.",
      },
      {
        key: "period",
        label: "Demand period",
        placeholder: "fifteen (15) calendar days",
        type: "text",
        default: "fifteen (15) calendar days",
        helper: "From receipt of the letter.",
      },
      {
        key: "sender",
        label: "Sender (law office + signatory)",
        placeholder: "Reyes Law Office · Atty. Maria Reyes",
        type: "text",
      },
    ],
  },
  {
    slug: "affidavit",
    apiKey: "affidavit",
    code: "T02",
    name: "Affidavit of Loss",
    blurb:
      "License, passport, OR/CR, IDs — with proper notarization clauses.",
    practiceAreas: ["civil", "remedial"],
    estimatedMinutes: "~3 min",
    fields: [
      {
        key: "affiant",
        label: "Affiant's full name",
        placeholder: "Maria Cristina Dela Cruz",
        type: "text",
        required: true,
      },
      {
        key: "affiant_age_civil",
        label: "Age, civil status, citizenship",
        placeholder: "32, single, Filipino",
        type: "text",
        required: true,
      },
      {
        key: "affiant_address",
        label: "Address",
        placeholder: "123 Mabini St., Brgy. San Antonio, Pasig City",
        type: "text",
        required: true,
      },
      {
        key: "lost_item",
        label: "Item lost",
        placeholder: "Driver's License",
        type: "text",
        required: true,
      },
      {
        key: "lost_item_details",
        label: "Identifying details",
        placeholder:
          "License No. N01-23-456789, issued by LTO Region IV-A on 12 March 2022, valid until 12 March 2027",
        type: "textarea",
        required: true,
        rows: 3,
      },
      {
        key: "circumstances",
        label: "Circumstances of loss",
        placeholder:
          "On 5 May 2026, while commuting from Makati to Pasig via jeepney, the affiant noticed her wallet missing upon disembarking. Despite diligent search and inquiry with the LRT-1 lost-and-found, the wallet — including the said license — was never recovered.",
        type: "textarea",
        required: true,
        rows: 4,
      },
      {
        key: "purpose",
        label: "Purpose of affidavit",
        placeholder: "Application for replacement license with the LTO",
        type: "text",
        required: true,
      },
    ],
  },
  {
    slug: "nlrc",
    apiKey: "nlrc",
    code: "T03",
    name: "NLRC Position Paper",
    blurb:
      "Labor disputes — illegal dismissal, money claims, regularization.",
    practiceAreas: ["labor"],
    estimatedMinutes: "~20 min",
    fields: [
      {
        key: "complainant",
        label: "Complainant",
        placeholder: "Juan A. Mendoza",
        type: "text",
        required: true,
      },
      {
        key: "respondent",
        label: "Respondent (employer)",
        placeholder: "ACME Logistics Corp. and/or Mr. Roberto Santos",
        type: "text",
        required: true,
      },
      {
        key: "nlrc_case_no",
        label: "NLRC Case No.",
        placeholder: "NLRC NCR Case No. 05-12345-26",
        type: "text",
        required: true,
      },
      {
        key: "arbiter",
        label: "Labor Arbiter",
        placeholder: "Hon. Maria Cruz",
        type: "text",
      },
      {
        key: "employment_facts",
        label: "Employment facts",
        placeholder:
          "Employed as warehouse supervisor from 15 Jan 2020. Monthly salary ₱28,000. Dismissed verbally on 12 Apr 2026 without notice or hearing.",
        type: "textarea",
        required: true,
        rows: 4,
      },
      {
        key: "causes_of_action",
        label: "Causes of action",
        placeholder:
          "Illegal dismissal · non-payment of separation pay · 13th-month pay differential · moral and exemplary damages · attorney's fees",
        type: "textarea",
        required: true,
        rows: 3,
      },
      {
        key: "prayer",
        label: "Prayer (relief sought)",
        placeholder:
          "Reinstatement without loss of seniority rights, full backwages, separation pay in lieu of reinstatement at complainant's option, ₱100,000 moral damages, ₱50,000 exemplary damages, 10% attorney's fees, and costs of suit.",
        type: "textarea",
        required: true,
        rows: 4,
      },
    ],
  },
  {
    slug: "mr",
    apiKey: "mr",
    code: "T04",
    name: "Motion for Reconsideration",
    blurb:
      "Reframes issues, cites the case the court missed.",
    practiceAreas: ["remedial", "civil"],
    estimatedMinutes: "~12 min",
    fields: [
      {
        key: "case_caption",
        label: "Case caption",
        placeholder: "People of the Philippines v. Juan Dela Cruz",
        type: "text",
        required: true,
      },
      {
        key: "court",
        label: "Court",
        placeholder: "Regional Trial Court, Branch 123, Manila",
        type: "text",
        required: true,
      },
      {
        key: "case_no",
        label: "Case No.",
        placeholder: "Crim. Case No. R-MNL-26-01234-CR",
        type: "text",
        required: true,
      },
      {
        key: "decision_date",
        label: "Date of decision sought to be reconsidered",
        placeholder: "14 January 2026",
        type: "text",
        required: true,
      },
      {
        key: "movant",
        label: "Movant",
        placeholder: "the accused-movant, through counsel",
        type: "text",
        required: true,
      },
      {
        key: "grounds",
        label: "Grounds",
        placeholder:
          "1. The Honorable Court overlooked controlling jurisprudence on the chain-of-custody rule under Section 21, R.A. 9165.\n2. The Honorable Court misapprehended the testimony of the apprehending officer regarding the absence of insulating witnesses.",
        type: "textarea",
        required: true,
        rows: 5,
      },
      {
        key: "arguments",
        label: "Brief arguments",
        placeholder:
          "Discuss each ground with the supporting authorities. The drafter will weave in citations from the retrieved corpus.",
        type: "textarea",
        rows: 5,
        helper:
          "Optional. If left blank, Ponente will produce general arguments grounded in retrieved authorities.",
      },
      {
        key: "prayer",
        label: "Prayer",
        placeholder:
          "WHEREFORE, premises considered, it is respectfully prayed that this Honorable Court reconsider its Decision dated [decision_date] and acquit the accused-movant.",
        type: "textarea",
        rows: 3,
      },
    ],
  },
  {
    slug: "petition",
    apiKey: "petition",
    code: "T05",
    name: "Verified Petition",
    blurb:
      "Certiorari, prohibition, mandamus — verification + cert. of NFS.",
    practiceAreas: ["remedial", "constitutional"],
    estimatedMinutes: "~30 min",
    fields: [
      {
        key: "petitioner",
        label: "Petitioner",
        placeholder: "Juan A. Dela Cruz, of legal age, Filipino citizen",
        type: "text",
        required: true,
      },
      {
        key: "respondent",
        label: "Respondent(s)",
        placeholder:
          "Hon. Maria Santos, Presiding Judge of RTC Branch 99 of Manila, and Roberto Lim",
        type: "text",
        required: true,
      },
      {
        key: "court",
        label: "Court",
        placeholder: "Court of Appeals",
        type: "text",
        required: true,
      },
      {
        key: "nature",
        label: "Nature of petition",
        type: "select",
        options: [
          "Certiorari (Rule 65)",
          "Prohibition (Rule 65)",
          "Mandamus (Rule 65)",
          "Quo Warranto (Rule 66)",
          "Habeas Corpus (Rule 102)",
        ],
        required: true,
        default: "Certiorari (Rule 65)",
      },
      {
        key: "assailed_action",
        label: "Assailed act / order",
        placeholder:
          "The Order dated 4 Mar 2026 of public respondent in Civil Case No. R-MNL-25-09876 denying petitioner's motion to dismiss",
        type: "textarea",
        required: true,
        rows: 3,
      },
      {
        key: "grounds",
        label: "Grounds",
        placeholder:
          "I. The public respondent acted with grave abuse of discretion amounting to lack or excess of jurisdiction in [...].\n\nII. There is no plain, speedy, and adequate remedy in the ordinary course of law.",
        type: "textarea",
        required: true,
        rows: 5,
      },
      {
        key: "prayer",
        label: "Prayer",
        placeholder:
          "WHEREFORE, premises considered, petitioner respectfully prays that this Honorable Court [...]",
        type: "textarea",
        required: true,
        rows: 4,
      },
      {
        key: "verification_signatory",
        label: "Verification signatory",
        placeholder: "Juan A. Dela Cruz",
        type: "text",
        required: true,
        helper:
          "Person who signs the verification and certification of non-forum shopping.",
      },
    ],
  },
];

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

/** Build initial form state with defaults applied. */
export function initialFacts(template: Template): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of template.fields) {
    out[f.key] = f.default ?? "";
  }
  return out;
}

/** Returns the keys of any required fields that are missing or whitespace-only. */
export function missingRequired(
  template: Template,
  facts: Record<string, string>,
): string[] {
  return template.fields
    .filter((f) => f.required && !(facts[f.key] ?? "").trim())
    .map((f) => f.key);
}
