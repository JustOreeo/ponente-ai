import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile, type Profile } from "@/lib/auth/session";

/**
 * Firm details + the caller's role within it.
 *
 * This is the canonical "is the user an admin of any firm?" check used by
 * /admin/* layouts and API routes. Returns null if the user has no firm.
 */
export type FirmContext = {
  firm: {
    id: string;
    name: string;
    plan: "free" | "pro" | "small_firm";
  };
  role: "admin" | "member";
};

export async function getFirmContext(): Promise<FirmContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Read profile (RLS allows own).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, firm_id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.firm_id) return null;

  const { data: firm } = await supabase
    .from("firms")
    .select("id, name, plan, created_at")
    .eq("id", profile.firm_id)
    .maybeSingle();
  if (!firm) return null;

  return {
    firm: { id: firm.id, name: firm.name, plan: firm.plan },
    role: profile.role,
  };
}

/**
 * Require the caller to be an admin of some firm. Used by /admin/* pages
 * and admin-only API routes. Redirects signed-out users to /sign-in,
 * signed-in-but-not-admin users to /library.
 */
export async function requireFirmAdmin(): Promise<{
  profile: Profile;
  context: FirmContext;
}> {
  const profile = await requireProfile("/admin");
  const context = await getFirmContext();
  if (!context || context.role !== "admin") {
    redirect("/library");
  }
  return { profile, context };
}

/**
 * List all members of the given firm. Admin-only — relies on caller having
 * already passed requireFirmAdmin().
 */
export async function listFirmMembers(firmId: string): Promise<
  Array<{
    id: string;
    full_name: string | null;
    role: "admin" | "member";
    created_at: string;
  }>
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, firm_id, role, created_at")
    .eq("firm_id", firmId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
  }));
}

/**
 * List active (unaccepted, unexpired) invites for the firm.
 */
export async function listFirmInvites(firmId: string): Promise<
  Array<{
    id: string;
    email: string;
    role: "admin" | "member";
    token: string;
    expires_at: string;
    created_at: string;
  }>
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("firm_invites")
    .select("id, firm_id, email, role, token, expires_at, accepted_at, accepted_by, created_by, created_at")
    .eq("firm_id", firmId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    token: row.token,
    expires_at: row.expires_at,
    created_at: row.created_at,
  }));
}
