import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteChat,
  getChatWithMessages,
  patchChat,
} from "@/lib/persist/chats";
import { sanitizePracticeAreas } from "@/lib/draft/practice-areas";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;
type PatchBody = {
  title?: unknown;
  practiceAreas?: unknown;
  archived?: unknown;
};

export async function GET(_req: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  const result = await getChatWithMessages(id);
  if (!result) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(result, { status: 200 });
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
  const patch: Parameters<typeof patchChat>[1] = {};
  if (typeof body.title === "string") patch.title = body.title.trim() || "New chat";
  if (body.practiceAreas !== undefined) {
    patch.practice_areas = sanitizePracticeAreas(body.practiceAreas);
  }
  if (typeof body.archived === "boolean") patch.archived = body.archived;

  try {
    await patchChat(id, patch);
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
    await deleteChat(id);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed." },
      { status: 500 },
    );
  }
}
