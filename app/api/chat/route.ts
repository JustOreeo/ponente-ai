import { NextResponse } from "next/server";
import { getAIClient } from "@/lib/ai/client";
import { streamEventsResponse } from "@/lib/ai/stream";
import type { ChatMessage } from "@/lib/ai/events";

export const runtime = "nodejs";

type Body = {
  messages?: unknown;
};

function isChatMessageArray(value: unknown): value is ChatMessage[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (m) =>
      typeof m === "object" &&
      m !== null &&
      (m as { role?: unknown }).role !== undefined &&
      ((m as { role?: unknown }).role === "user" ||
        (m as { role?: unknown }).role === "assistant") &&
      typeof (m as { content?: unknown }).content === "string",
  );
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!isChatMessageArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid `messages` array." },
      { status: 400 },
    );
  }

  const ai = getAIClient();
  return streamEventsResponse(ai.chat(body.messages));
}
