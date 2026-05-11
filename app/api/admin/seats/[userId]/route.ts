import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFirmContext } from "@/lib/auth/firm";

export const runtime = "nodejs";

type Params = Promise<{ userId: string }>;

/**
 * DELETE — remove a member from the firm (set firm_id = null + role = member).
 *          Admin-only. Cannot remove yourself if you're the only admin.
 * PATCH  — change member role. Body: { role: "admin" | "member" }
 *          Admin-only. Demoting yourself only allowed if another admin exists.
 */

type RoleBody = { role?: unknown };

async function ensureAtLeastOneOtherAdmin(
  firmId: string,
  excludingUserId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("firm_id", firmId)
    .eq("role", "admin")
    .neq("id", excludingUserId);
  return (count ?? 0) >= 1;
}

export async function DELETE(_req: Request, { params }: { params: Params }) {
  const { userId } = await params;
  const ctx = await getFirmContext();
  if (!ctx) return NextResponse.json({ error: "Not in a firm." }, { status: 404 });
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, full_name, firm_id, role, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!target || target.firm_id !== ctx.firm.id) {
    return NextResponse.json({ error: "Not a member of your firm." }, { status: 404 });
  }

  // If the target is an admin (themselves or another), enforce
  // "at least one admin must remain in the firm."
  if (target.role === "admin") {
    const ok = await ensureAtLeastOneOtherAdmin(ctx.firm.id, userId);
    if (!ok) {
      return NextResponse.json(
        { error: "Can't remove the only admin. Promote someone else first." },
        { status: 409 },
      );
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ firm_id: null, role: "member" })
    .eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { userId } = await params;
  const ctx = await getFirmContext();
  if (!ctx) return NextResponse.json({ error: "Not in a firm." }, { status: 404 });
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  let body: RoleBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.role !== "admin" && body.role !== "member") {
    return NextResponse.json(
      { error: "role must be 'admin' or 'member'." },
      { status: 400 },
    );
  }
  const newRole = body.role;

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("id, full_name, firm_id, role, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!target || target.firm_id !== ctx.firm.id) {
    return NextResponse.json({ error: "Not a member of your firm." }, { status: 404 });
  }

  // Demoting an existing admin: ensure at least one admin remains.
  if (target.role === "admin" && newRole === "member") {
    const ok = await ensureAtLeastOneOtherAdmin(ctx.firm.id, userId);
    if (!ok) {
      return NextResponse.json(
        { error: "Can't demote the only admin. Promote someone else first." },
        { status: 409 },
      );
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, role: newRole }, { status: 200 });
}
