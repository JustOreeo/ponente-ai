import { NextResponse } from "next/server";
import { getAIClient } from "@/lib/ai/client";
import { streamEventsResponse } from "@/lib/ai/stream";

export const runtime = "nodejs";

type Body = {
  template?: unknown;
  facts?: unknown;
};

const ALLOWED_TEMPLATES = new Set([
  "demand",
  "affidavit",
  "nlrc",
  "mr",
  "petition",
]);

function isFacts(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(value as Record<string, unknown>).every(
    (v) => typeof v === "string",
  );
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const template =
    typeof body.template === "string" ? body.template : "demand";
  if (!ALLOWED_TEMPLATES.has(template)) {
    return NextResponse.json(
      { error: `Unknown template: ${template}` },
      { status: 400 },
    );
  }
  const facts = isFacts(body.facts) ? body.facts : {};

  const ai = getAIClient();
  return streamEventsResponse(ai.draft(template, facts));
}
