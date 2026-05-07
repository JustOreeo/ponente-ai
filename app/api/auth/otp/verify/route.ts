import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  email?: unknown;
  token?: unknown;
};

export async function POST(request: Request) {
  let body: RequestBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";

  if (!email || !token) {
    return NextResponse.json(
      { error: "Missing email or code." },
      { status: 400 },
    );
  }
  if (!/^\d{6}$/.test(token)) {
    return NextResponse.json(
      { error: "Code must be 6 digits." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Invalid or expired code." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
