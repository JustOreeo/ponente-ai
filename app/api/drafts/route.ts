import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createDraft,
  listDrafts,
  type DraftTemplate,
} from "@/lib/persist/drafts";

export const runtime = "nodejs";

const TEMPLATES: ReadonlySet<DraftTemplate> = new Set<DraftTemplate>([
  "demand",
  "affidavit",
  "nlrc",
  "mr",
  "petition",
]);

type CreateBody = {
  template?: unknown;
  title?: unknown;
  facts?: unknown;
  body?: unknown;
};

function isStringMap(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value as Record<string, unknown>).every(
    (v) => typeof v === "string",
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ drafts: [] }, { status: 200 });
  const drafts = await listDrafts();
  return NextResponse.json({ drafts }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.template !== "string" || !TEMPLATES.has(body.template as DraftTemplate)) {
    return NextResponse.json(
      { error: "template must be one of demand, affidavit, nlrc, mr, petition." },
      { status: 400 },
    );
  }
  const template = body.template as DraftTemplate;
  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const facts = isStringMap(body.facts) ? body.facts : {};
  const bodyText = typeof body.body === "string" ? body.body : "";

  try {
    const draft = await createDraft({
      userId: user.id,
      template,
      title,
      facts,
      body: bodyText,
    });
    return NextResponse.json({ draft }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed." },
      { status: 500 },
    );
  }
}
