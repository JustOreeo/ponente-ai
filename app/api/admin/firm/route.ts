import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFirmContext } from "@/lib/auth/firm";

export const runtime = "nodejs";

/**
 * GET — return the caller's firm context (firm + role).
 * POST — create a new firm and assign the caller as its admin.
 *        Body: { name: string }
 * PATCH — update firm name. Admin-only.
 *         Body: { name: string }
 */

type CreateBody = { name?: unknown };
type UpdateBody = { name?: unknown };

export async function GET() {
  const ctx = await getFirmContext();
  if (!ctx) return NextResponse.json({ firm: null }, { status: 200 });
  return NextResponse.json(ctx, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  // Block if user is already in a firm — surface that distinction so the UI
  // can route them to /admin instead.
  const existing = await getFirmContext();
  if (existing) {
    return NextResponse.json(
      { error: "Already a member of a firm.", firm: existing.firm },
      { status: 409 },
    );
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Firm name required." },
      { status: 400 },
    );
  }

  // Use service role to do the firm create + profile update atomically.
  const admin = createAdminClient();
  const { data: firm, error: firmErr } = await admin
    .from("firms")
    .insert({ name, plan: "free" })
    .select("id, name, plan, created_at")
    .single();
  if (firmErr || !firm) {
    return NextResponse.json(
      { error: firmErr?.message ?? "Failed to create firm." },
      { status: 500 },
    );
  }

  const { error: profErr } = await admin
    .from("profiles")
    .update({ firm_id: firm.id, role: "admin" })
    .eq("id", user.id);
  if (profErr) {
    // Best-effort cleanup — delete the orphaned firm.
    await admin.from("firms").delete().eq("id", firm.id);
    return NextResponse.json(
      { error: "Failed to assign you as admin: " + profErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      firm: { id: firm.id, name: firm.name, plan: firm.plan },
      role: "admin",
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const ctx = await getFirmContext();
  if (!ctx) {
    return NextResponse.json({ error: "Not in a firm." }, { status: 404 });
  }
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  let body: UpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json(
      { error: "Firm name required." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("firms").update({ name }).eq("id", ctx.firm.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    { firm: { ...ctx.firm, name }, role: ctx.role },
    { status: 200 },
  );
}
