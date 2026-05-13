import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteDraft,
  getDraft,
  patchDraft,
  type DraftStatus,
} from "@/lib/persist/drafts";
import type { Citation } from "@/lib/ai/events";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

type PatchBody = {
  title?: unknown;
  facts?: unknown;
  body?: unknown;
  citations?: unknown;
  status?: unknown;
  archived?: unknown;
};

const VALID_STATUSES: ReadonlySet<DraftStatus> = new Set<DraftStatus>([
  "drafting",
  "review",
  "final",
]);

function isStringMap(value: unknown): value is Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value as Record<string, unknown>).every(
    (v) => typeof v === "string",
  );
}

function isCitationArray(value: unknown): value is Citation[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (c) =>
      typeof c === "object" &&
      c !== null &&
      typeof (c as Citation).tag === "string" &&
      typeof (c as Citation).name === "string" &&
      typeof (c as Citation).meta === "string" &&
      ((c as Citation).status === "verified" ||
        (c as Citation).status === "unverified"),
  );
}

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  const draft = await getDraft(id);
  if (!draft) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ draft }, { status: 200 });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: Parameters<typeof patchDraft>[1] = {};
  if (typeof body.title === "string") patch.title = body.title.trim() || "Untitled draft";
  if (isStringMap(body.facts)) patch.facts = body.facts;
  if (typeof body.body === "string") patch.body = body.body;
  if (isCitationArray(body.citations)) patch.citations = body.citations;
  if (typeof body.status === "string" && VALID_STATUSES.has(body.status as DraftStatus)) {
    patch.status = body.status as DraftStatus;
  }
  if (typeof body.archived === "boolean") patch.archived = body.archived;

  try {
    await patchDraft(id, patch);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Patch failed." },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });
  try {
    await deleteDraft(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed." },
      { status: 500 },
    );
  }
}
