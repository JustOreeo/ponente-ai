import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createChat, listChats } from "@/lib/persist/chats";
import { sanitizePracticeAreas } from "@/lib/draft/practice-areas";

export const runtime = "nodejs";

/**
 * GET — list caller's chats (most recent first).
 * POST — create a new chat. Body: { title?, practiceAreas? }
 */

type CreateBody = { title?: unknown; practiceAreas?: unknown };

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ chats: [] }, { status: 200 });
  const chats = await listChats();
  return NextResponse.json({ chats }, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  let body: CreateBody = {};
  try {
    body = await request.json();
  } catch {
    // empty body is fine — default title applies
  }
  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  const practiceAreas = sanitizePracticeAreas(body.practiceAreas);

  try {
    const chat = await createChat({
      userId: user.id,
      title,
      practiceAreas,
    });
    return NextResponse.json({ chat }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create chat." },
      { status: 500 },
    );
  }
}
