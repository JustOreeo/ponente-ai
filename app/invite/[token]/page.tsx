import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AcceptInviteClient } from "./_components/accept-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join firm — Ponente",
};

type Params = Promise<{ token: string }>;

type LoadResult =
  | {
      kind: "ok";
      firmName: string;
      email: string;
      role: "admin" | "member";
      expiresAt: string;
    }
  | { kind: "expired" }
  | { kind: "accepted" }
  | { kind: "missing" };

async function loadInvite(token: string): Promise<LoadResult> {
  if (!token || token.length < 16) return { kind: "missing" };

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("firm_invites")
    .select("id, firm_id, email, role, token, expires_at, accepted_at, accepted_by, created_by, created_at")
    .eq("token", token)
    .maybeSingle();
  if (!invite) return { kind: "missing" };
  if (invite.accepted_at) return { kind: "accepted" };
  if (new Date(invite.expires_at) < new Date()) return { kind: "expired" };

  const { data: firm } = await admin
    .from("firms")
    .select("id, name, plan, created_at")
    .eq("id", invite.firm_id)
    .maybeSingle();

  return {
    kind: "ok",
    firmName: firm?.name ?? "a firm",
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expires_at,
  };
}

export default async function InvitePage({ params }: { params: Params }) {
  const { token } = await params;
  const invite = await loadInvite(token);
  if (invite.kind === "missing") notFound();

  // Resolve current user (signed in or not).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentEmail = user?.email ?? null;

  return (
    <main className="min-h-screen bg-parchment text-ink flex items-center justify-center px-6 py-12">
      <div className="bg-surface border border-line p-8 sm:p-10 max-w-[480px] w-full">
        {invite.kind === "expired" || invite.kind === "accepted" ? (
          <ExpiredOrUsed kind={invite.kind} />
        ) : (
          <AcceptInviteClient
            token={token}
            firmName={invite.firmName}
            email={invite.email}
            role={invite.role}
            expiresAt={invite.expiresAt}
            currentEmail={currentEmail}
          />
        )}
      </div>
    </main>
  );
}

function ExpiredOrUsed({ kind }: { kind: "expired" | "accepted" }) {
  return (
    <>
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
        {kind === "expired" ? "Invite expired" : "Already accepted"}
      </div>
      <h1
        className="font-serif text-[28px] font-normal m-0 mb-3"
        style={{ letterSpacing: "-0.018em" }}
      >
        {kind === "expired"
          ? "This invite is no longer valid."
          : "Already accepted."}
      </h1>
      <p className="text-[14.5px] text-ink-soft m-0 leading-[1.55]">
        Ask the firm admin for a fresh invite.
      </p>
    </>
  );
}
