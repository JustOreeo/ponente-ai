import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  email?: unknown;
  full_name?: unknown;
  mode?: unknown;
};

export async function POST(request: Request) {
  let body: RequestBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const fullName =
    typeof body.full_name === "string" ? body.full_name.trim() : null;
  const mode = body.mode === "signin" ? "signin" : "signup";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === "signup",
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  if (error) {
    // Common errors from Supabase:
    // - "Signups not allowed for otp" (when shouldCreateUser=false and user doesn't exist)
    // - rate limit errors
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
