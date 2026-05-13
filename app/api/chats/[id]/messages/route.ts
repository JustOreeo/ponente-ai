import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appendMessage } from "@/lib/persist/chats";
import type { Citation } from "@/lib/ai/events";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;
type Body = { role?: unknown; body?: unknown; citations?: unknown };

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

export async function POST(request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.role !== "user" && body.role !== "assistant") {
    return NextResponse.json(
      { error: "role must be 'user' or 'assistant'." },
      { status: 400 },
    );
  }
  if (typeof body.body !== "string" || !body.body.trim()) {
    return NextResponse.json({ error: "body required." }, { status: 400 });
  }
  const citations = isCitationArray(body.citations) ? body.citations : [];

  try {
    const message = await appendMessage({
      chatId: id,
      role: body.role,
      body: body.body,
      citations,
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Append failed." },
      { status: 500 },
    );
  }
}
