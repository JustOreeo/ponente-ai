import { NextResponse } from "next/server";
import { bodyToDocxBuffer } from "@/lib/draft/docx";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 200_000; // ~200KB of text — generous; sanity cap.

type Body = {
  title?: unknown;
  template?: unknown;
  body?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const template =
    typeof body.template === "string" ? body.template.trim() : "draft";
  const text = typeof body.body === "string" ? body.body : "";

  if (!title) {
    return NextResponse.json({ error: "Missing title." }, { status: 400 });
  }
  if (!text.trim()) {
    return NextResponse.json({ error: "Missing body." }, { status: 400 });
  }
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "Body exceeds maximum size." },
      { status: 413 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = await bodyToDocxBuffer({ title, body: text, template });
  } catch (err) {
    return NextResponse.json(
      {
        error: `docx generation failed: ${err instanceof Error ? err.message : "unknown"}`,
      },
      { status: 500 },
    );
  }

  const filename = `${template}-draft.docx`;
  // Use a Uint8Array view explicitly so the Response body type is happy.
  const u8 = new Uint8Array(buffer);
  return new Response(u8, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(u8.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
