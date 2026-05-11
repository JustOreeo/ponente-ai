import { NextResponse } from "next/server";
import { getAIClient } from "@/lib/ai/client";
import { streamEventsResponse } from "@/lib/ai/stream";
import {
  checkAndIncrementQuota,
  QuotaExceededError,
  UnauthenticatedError,
} from "@/lib/auth/quota";
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

  // Quota enforcement is skipped when Supabase isn't configured (dev/UI iteration
  // without keys). The AI client itself falls back to the stub in that case.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await checkAndIncrementQuota("qa");
    } catch (err) {
      if (err instanceof UnauthenticatedError) {
        return NextResponse.json(
          { error: "Sign in to ask questions." },
          { status: 401 },
        );
      }
      if (err instanceof QuotaExceededError) {
        return NextResponse.json(
          {
            error: err.message,
            kind: "quota_exceeded",
            type: err.type,
            limit: err.limit,
            used: err.used,
            plan: err.plan,
          },
          { status: 429 },
        );
      }
      throw err;
    }
  }

  const ai = getAIClient();
  return streamEventsResponse(ai.chat(body.messages));
}
