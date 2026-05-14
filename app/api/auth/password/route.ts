import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RequestBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: RequestBody = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json(
      { error: "Enter your password." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return NextResponse.json(
      { error: error?.message ?? "Invalid email or password." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
