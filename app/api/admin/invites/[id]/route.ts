import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFirmContext } from "@/lib/auth/firm";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

/**
 * DELETE — revoke a pending invite. Admin-only.
 */
export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { id } = await params;
  const ctx = await getFirmContext();
  if (!ctx) {
    return NextResponse.json({ error: "Not in a firm." }, { status: 404 });
  }
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const admin = createAdminClient();
  // Double-check the invite belongs to this firm before deleting.
  const { data: existing } = await admin
    .from("firm_invites")
    .select("id, firm_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }
  if (existing.firm_id !== ctx.firm.id) {
    return NextResponse.json({ error: "Wrong firm." }, { status: 403 });
  }

  const { error } = await admin.from("firm_invites").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
