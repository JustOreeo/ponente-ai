import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Params = Promise<{ token: string }>;

/**
 * GET — return invite details by token (no auth required — token is the
 *       secret). Used by /invite/<token> to show "Join <Firm Name>".
 * POST — accept the invite. Caller must be signed in with the email the
 *        invite was sent to. On success: caller's profile.firm_id +
 *        profile.role are updated; invite is marked accepted.
 */

export async function GET(_req: Request, { params }: { params: Params }) {
  const { token } = await params;
  if (!token || token.length < 16) {
    return NextResponse.json({ error: "Invalid invite token." }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("firm_invites")
    .select("id, firm_id, email, role, token, expires_at, accepted_at, accepted_by, created_by, created_at")
    .eq("token", token)
    .maybeSingle();
  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: "Invite already accepted." }, { status: 410 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite has expired." }, { status: 410 });
  }

  // Fetch firm name for display.
  const { data: firm } = await admin
    .from("firms")
    .select("id, name, plan, created_at")
    .eq("id", invite.firm_id)
    .maybeSingle();

  return NextResponse.json(
    {
      invite: {
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
      },
      firm: firm ? { id: firm.id, name: firm.name, plan: firm.plan } : null,
    },
    { status: 200 },
  );
}

export async function POST(_req: Request, { params }: { params: Params }) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in with the invited email to accept." },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("firm_invites")
    .select("id, firm_id, email, role, token, expires_at, accepted_at, accepted_by, created_by, created_at")
    .eq("token", token)
    .maybeSingle();
  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }
  if (invite.accepted_at) {
    return NextResponse.json({ error: "Invite already accepted." }, { status: 410 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite has expired." }, { status: 410 });
  }
  if ((user.email ?? "").toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `This invite is for ${invite.email}. Sign in with that account.`,
      },
      { status: 403 },
    );
  }

  // Update profile + mark invite accepted in two writes.
  const { error: profErr } = await admin
    .from("profiles")
    .update({ firm_id: invite.firm_id, role: invite.role })
    .eq("id", user.id);
  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }
  const { error: invErr } = await admin
    .from("firm_invites")
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id })
    .eq("id", invite.id);
  if (invErr) {
    // Profile update succeeded but mark-accepted failed. Not the end of the
    // world — the invite will still expire on its TTL. Log and proceed.
    console.error(
      "[invite/accept] profile updated but invite mark failed:",
      invErr,
    );
  }

  return NextResponse.json(
    { ok: true, firm_id: invite.firm_id, role: invite.role },
    { status: 200 },
  );
}
