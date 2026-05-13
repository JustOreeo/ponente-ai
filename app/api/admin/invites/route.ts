import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFirmContext, listFirmInvites } from "@/lib/auth/firm";
import { sendEmail } from "@/lib/email/resend";
import { renderInviteEmail } from "@/lib/email/templates";

export const runtime = "nodejs";

/**
 * GET  — list active invites for the caller's firm. Admin-only.
 * POST — create an invite. Body: { email: string, role?: "admin" | "member" }
 */

type CreateBody = { email?: unknown; role?: unknown };

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function GET() {
  const ctx = await getFirmContext();
  if (!ctx) {
    return NextResponse.json({ error: "Not in a firm." }, { status: 404 });
  }
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const invites = await listFirmInvites(ctx.firm.id);
  return NextResponse.json({ invites }, { status: 200 });
}

export async function POST(request: Request) {
  const ctx = await getFirmContext();
  if (!ctx) {
    return NextResponse.json({ error: "Not in a firm." }, { status: 404 });
  }
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in." }, { status: 401 });

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body.role === "admin" ? "admin" : "member";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Valid email required." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // If an active invite for this email already exists in this firm, return it
  // (idempotent re-invite — admins copy the link again).
  const { data: existingRows } = await admin
    .from("firm_invites")
    .select("id, firm_id, email, role, token, expires_at, accepted_at, accepted_by, created_by, created_at")
    .eq("firm_id", ctx.firm.id)
    .eq("email", email)
    .is("accepted_at", null)
    .limit(1);
  const existing = existingRows?.[0];
  if (existing && new Date(existing.expires_at) > new Date()) {
    return NextResponse.json(
      {
        invite: {
          id: existing.id,
          email: existing.email,
          role: existing.role,
          token: existing.token,
          expires_at: existing.expires_at,
        },
        reused: true,
      },
      { status: 200 },
    );
  }

  const { data: inserted, error } = await admin
    .from("firm_invites")
    .insert({
      firm_id: ctx.firm.id,
      email,
      role,
      created_by: user.id,
    })
    .select("id, firm_id, email, role, token, expires_at, accepted_at, accepted_by, created_by, created_at")
    .single();
  if (error || !inserted) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create invite." },
      { status: 500 },
    );
  }

  // Best-effort: send the invite via Resend if configured. UI still falls
  // back to the copy-link button regardless.
  const acceptUrl = inviteUrl(request, inserted.token);
  let emailDelivery: "sent" | "skipped" | { failed: string } = "skipped";
  try {
    const { data: inviterProfile } = await admin
      .from("profiles")
      .select("id, full_name, firm_id, role, created_at")
      .eq("id", user.id)
      .maybeSingle();
    const result = await sendEmail({
      to: email,
      ...renderInviteEmail({
        firmName: ctx.firm.name,
        inviterName: inviterProfile?.full_name ?? null,
        recipientEmail: email,
        acceptUrl,
        expiresAt: inserted.expires_at,
        role: inserted.role,
      }),
      tags: [
        { name: "kind", value: "firm_invite" },
        { name: "firm_id", value: ctx.firm.id },
      ],
    });
    if (result.sent) emailDelivery = "sent";
    else emailDelivery = { failed: result.reason };
  } catch (err) {
    emailDelivery = {
      failed: err instanceof Error ? err.message : "unknown",
    };
  }

  return NextResponse.json(
    {
      invite: {
        id: inserted.id,
        email: inserted.email,
        role: inserted.role,
        token: inserted.token,
        expires_at: inserted.expires_at,
      },
      email_delivery: emailDelivery,
    },
    { status: 201 },
  );
}

function inviteUrl(request: Request, token: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return `${fromEnv}/invite/${token}`;
  // Fall back to the request origin (works on Vercel and localhost).
  const origin = new URL(request.url).origin;
  return `${origin}/invite/${token}`;
}
