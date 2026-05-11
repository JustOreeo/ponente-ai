import { NextResponse } from "next/server";
import { streamEventsResponse } from "@/lib/ai/stream";
import type { StreamEvent } from "@/lib/ai/events";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse`;

const SYSTEM_PROMPT = `You translate and lightly simplify Philippine legal explanations from English to Filipino (Tagalog).

Rules:
- Keep legal citations (G.R. No., R.A. No., Art., Sec., case names) in English / their official form. Don't try to translate those.
- Keep formal legal terms in English when they have no clean Tagalog equivalent. Inserting them in italics/quotes inside the Tagalog sentence is fine.
- Use plain conversational Tagalog (Manila-standard), not formal Filipino. Speak as a lawyer would explain to a Tagalog-speaking client over the phone.
- Preserve [[citation]] markers verbatim — they render as pills in the UI.
- Preserve **bold** markers verbatim.
- Don't add introductory pleasantries ("Eto ang Tagalog version..."). Just translate.
- If the English text is already clear, prefer faithful translation over paraphrase. Don't add new content.

Output the Tagalog explanation only. No prose around it.`;

type Body = { text?: unknown };

type GeminiSseEvent = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }
  if (text.length > 20_000) {
    return NextResponse.json({ error: "Text too long." }, { status: 413 });
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    // Without the key, return a single-event stream that politely says so.
    return streamEventsResponse(stubExplain(text));
  }

  return streamEventsResponse(geminiTagalog(text, apiKey));
}

async function* geminiTagalog(text: string, apiKey: string): AsyncIterable<StreamEvent> {
  const res = await fetch(`${GEMINI_URL}&key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    yield {
      type: "error",
      message: `Gemini ${res.status}: ${errText.slice(0, 200) || "no body"}`,
    };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Gemini SSE: each event is "data: {json}\n\n"
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const chunk = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const line = chunk
          .split("\n")
          .find((l) => l.startsWith("data:"))
          ?.slice("data:".length)
          .trim();
        if (!line) continue;
        try {
          const event = JSON.parse(line) as GeminiSseEvent;
          if (event.error?.message) {
            yield { type: "error", message: event.error.message };
            return;
          }
          if (event.promptFeedback?.blockReason) {
            yield {
              type: "error",
              message: `Blocked: ${event.promptFeedback.blockReason}`,
            };
            return;
          }
          const parts = event.candidates?.[0]?.content?.parts ?? [];
          for (const part of parts) {
            if (typeof part.text === "string" && part.text.length > 0) {
              yield { type: "text", delta: part.text };
            }
          }
        } catch {
          // Tolerate the occasional malformed line; Gemini sometimes emits keepalives
        }
      }
    }
    yield { type: "done" };
  } finally {
    reader.releaseLock();
  }
}

async function* stubExplain(text: string): AsyncIterable<StreamEvent> {
  // Friendly placeholder when GOOGLE_AI_API_KEY isn't configured.
  yield {
    type: "text",
    delta:
      "(Wala pa pong Tagalog explainer — pakidagdag ang GOOGLE_AI_API_KEY sa .env.local at i-restart ang server.)\n\n",
  };
  yield { type: "text", delta: text };
  yield { type: "done" };
}
