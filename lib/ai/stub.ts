import "server-only";
import type {
  ChatMessage,
  Citation,
  DraftFacts,
  StreamEvent,
} from "./events";

/**
 * Stub AI implementations. Emit canned responses on a timer so the UI streams
 * realistically. When Anthropic creds are wired, this file gets replaced (or
 * the `getAIClient` factory returns a real adapter instead).
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// CHAT
// ---------------------------------------------------------------------------

const QA_TEMPLATES: { match: RegExp; segments: ResponseSegment[] }[] = [
  {
    match: /\b(advance rent|rent control|lease|lessor|tenant)\b/i,
    segments: [
      {
        text: "For residential leases, advance rent is regulated. Under ",
      },
      {
        cite: {
          tag: "R.A. No. 9653",
          name: "Rent Control Act of 2009",
          meta: "Republic Act · verified",
          status: "verified",
        },
      },
      {
        text: " (the Rent Control Act of 2009, as extended), lessors of covered units may demand no more than one (1) month advance rent and two (2) months security deposit at the start of the lease.\n\n",
      },
      {
        text: "Outside the Rent Control Act's coverage (units exceeding the monthly cap), the parties may stipulate freely under ",
      },
      {
        cite: {
          tag: "Art. 1306, Civil Code",
          name: "Civil Code of the Philippines",
          meta: "Republic Act · verified",
          status: "verified",
        },
      },
      {
        text: " — but the terms still cannot run contrary to law, morals, or public order.\n\n",
      },
      {
        text: "The Court has applied this distinction consistently — see ",
      },
      {
        cite: {
          tag: "G.R. No. 196444",
          name: "Solid Homes v. Spouses Tan",
          meta: "2014 · 2nd Division",
          status: "verified",
        },
      },
      {
        text: " (2014), where rent demandability was anchored to the agreed term.",
      },
    ],
  },
  {
    match: /\b(demand letter|demand|mora|default|civil code|obligation)\b/i,
    segments: [
      {
        text: "An extrajudicial demand becomes effective upon receipt by the debtor. Under ",
      },
      {
        cite: {
          tag: "Art. 1169, Civil Code",
          name: "Civil Code of the Philippines",
          meta: "Republic Act · verified",
          status: "verified",
        },
      },
      {
        text: ", the obligation becomes demandable when the term expires; continued non-payment thereafter constitutes mora solvendi.\n\n",
      },
      {
        text: "The Supreme Court has clarified that demand can be made through any clear, unequivocal communication — see ",
      },
      {
        cite: {
          tag: "G.R. No. 175852",
          name: "Spouses Reyes v. BPI",
          meta: "2010 · En Banc",
          status: "verified",
        },
      },
      {
        text: " — and that failure to demand does not extinguish the obligation, only the right to claim damages from default.",
      },
    ],
  },
  {
    match: /\b(nlrc|labor|illegal dismissal|termination|employee|employer)\b/i,
    segments: [
      {
        text: "Under the Labor Code, dismissal must be for a just or authorized cause and must observe procedural due process. ",
      },
      {
        cite: {
          tag: "Art. 297, Labor Code",
          name: "Labor Code of the Philippines",
          meta: "Republic Act · verified",
          status: "verified",
        },
      },
      {
        text: " enumerates the just causes; ",
      },
      {
        cite: {
          tag: "Art. 298, Labor Code",
          name: "Labor Code of the Philippines",
          meta: "Republic Act · verified",
          status: "verified",
        },
      },
      {
        text: " covers authorized causes such as redundancy and retrenchment.\n\n",
      },
      {
        text: "The two-notice rule is well-established — see ",
      },
      {
        cite: {
          tag: "G.R. No. 158693",
          name: "Agabon v. NLRC",
          meta: "2004 · En Banc",
          status: "verified",
        },
      },
      {
        text: ". Failure to observe procedural due process does not invalidate the dismissal if there's a valid cause, but exposes the employer to nominal damages.",
      },
    ],
  },
];

const QA_FALLBACK: ResponseSegment[] = [
  {
    text: "I'd need to consult the relevant provisions and case law to give you a defensible answer to that. While I can speak to broad principles under Philippine law, ",
  },
  {
    text: "the specific question you raised requires checking the controlling statute and any recent Supreme Court rulings before I can cite anything verifiably.\n\n",
  },
  {
    text: "Try asking about a specific area — labor, contracts, demand letters, leases — and I'll ground each citation in a real source.",
  },
];

type ResponseSegment = { text: string } | { cite: Citation };

function chooseChatSegments(messages: ChatMessage[]): ResponseSegment[] {
  const last = messages[messages.length - 1]?.content ?? "";
  for (const { match, segments } of QA_TEMPLATES) {
    if (match.test(last)) return segments;
  }
  return QA_FALLBACK;
}

export async function* stubChat(
  messages: ChatMessage[],
): AsyncIterable<StreamEvent> {
  const segments = chooseChatSegments(messages);
  yield* emitSegments(segments, { perTokenMs: 12, perCitationMs: 200 });
  yield { type: "done" };
}

// ---------------------------------------------------------------------------
// DRAFT
// ---------------------------------------------------------------------------

const DRAFT_TEMPLATES: Record<string, (facts: DraftFacts) => ResponseSegment[]> = {
  demand: (f) => {
    const recipient = f.recipient || "Mr. Edgardo Tan";
    const amount = f.amount || "₱847,500.00";
    const obligation =
      f.obligation || "unpaid services rendered under the parties' Service Agreement";
    const period = f.period || "fifteen (15) calendar days";
    const sender = f.sender || "Reyes Law Office";
    return [
      {
        text: `Re: Demand for Payment\n\n**Dear ${recipient.replace(/^(Mr\.|Ms\.|Dr\.|Atty\.)\s+/, "Mr. ").split(" ")[1] || "Sir"},**\n\n`,
      },
      {
        text: `This is a formal demand for the immediate payment of **${amount}**, representing ${obligation}.\n\n`,
      },
      {
        text: "Under ",
      },
      {
        cite: {
          tag: "Art. 1169",
          name: "Civil Code of the Philippines",
          meta: "Republic Act · verified",
          status: "verified",
        },
      },
      {
        text: ", your obligation became demandable upon the lapse of the agreed period. Continued non-payment constitutes mora solvendi, with the corresponding legal consequences under Articles 1170 and 1171.\n\n",
      },
      {
        text: "The Supreme Court has consistently affirmed that demand may be effected through extrajudicial means — see ",
      },
      {
        cite: {
          tag: "G.R. No. 196444",
          name: "Solid Homes v. Spouses Tan",
          meta: "2014 · 2nd Division",
          status: "verified",
        },
      },
      {
        text: ". Further, the accrual of legal interest on monetary obligations is well settled under ",
      },
      {
        cite: {
          tag: "G.R. No. 175852",
          name: "Spouses Reyes v. BPI",
          meta: "2010 · En Banc",
          status: "verified",
        },
      },
      {
        text: ".\n\n",
      },
      {
        text: `Failure to remit the full amount within **${period}** from receipt hereof shall compel us to pursue all available legal remedies, including the filing of a complaint for collection of sum of money, with damages and costs of suit.\n\n`,
      },
      {
        text: "We trust that this matter shall be settled amicably and promptly.\n\n",
      },
      {
        text: `Very truly yours,\n\n**${sender}**`,
      },
    ];
  },
};

export async function* stubDraft(
  template: string,
  facts: DraftFacts,
): AsyncIterable<StreamEvent> {
  const builder = DRAFT_TEMPLATES[template] ?? DRAFT_TEMPLATES.demand;
  const segments = builder(facts);
  yield* emitSegments(segments, { perTokenMs: 8, perCitationMs: 250 });
  yield { type: "done" };
}

// ---------------------------------------------------------------------------
// Helpers — chunk text into "tokens" for that streaming feel
// ---------------------------------------------------------------------------

async function* emitSegments(
  segments: ResponseSegment[],
  opts: { perTokenMs: number; perCitationMs: number },
): AsyncIterable<StreamEvent> {
  for (const segment of segments) {
    if ("cite" in segment) {
      yield { type: "citation", citation: segment.cite };
      // Inline marker so the rendered text knows where the pill goes.
      yield { type: "text", delta: `[[${segment.cite.tag}]]` };
      await sleep(opts.perCitationMs);
      continue;
    }
    for (const chunk of tokenize(segment.text)) {
      yield { type: "text", delta: chunk };
      await sleep(opts.perTokenMs);
    }
  }
}

function tokenize(text: string): string[] {
  // Very rough tokenization — split on word-like boundaries while preserving
  // punctuation and whitespace. Good enough for streaming feel.
  const tokens = text.match(/[A-Za-z₱]+|\d+|[^\sA-Za-z₱\d]+|\s+/g);
  return tokens ?? [text];
}
