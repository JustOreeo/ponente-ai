import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type Profile = {
  id: string;
  full_name: string | null;
  firm_id: string | null;
  role: "admin" | "member";
};

/**
 * Get the current user's profile, or null if signed out.
 * Returns null if Supabase isn't configured yet — caller can treat that as
 * "no session" and redirect to /sign-in.
 * Use in Server Components where being signed out is OK.
 *
 * If the user is authenticated but no profile row exists (e.g., the
 * `handle_new_user` trigger never fired on this DB), backfills one using
 * the service-role client. Prevents the "signed in but no profile" redirect
 * loop between /library and /sign-in.
 */
export async function getProfile(): Promise<Profile | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) return profile;

  return await backfillProfile(user.id, user.email, user.user_metadata);
}

async function backfillProfile(
  userId: string,
  email: string | undefined,
  metadata: Record<string, unknown> | undefined,
): Promise<Profile | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const metaName =
    metadata && typeof metadata.full_name === "string"
      ? metadata.full_name
      : null;
  const fallbackName = email ? email.split("@")[0] : null;
  const fullName = metaName || fallbackName;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .insert({ id: userId, full_name: fullName })
    .select("id, full_name, firm_id, role")
    .single();

  if (error) {
    // Race: another request just created the row. Re-read.
    const { data: existing } = await admin
      .from("profiles")
      .select("id, full_name, firm_id, role")
      .eq("id", userId)
      .maybeSingle();
    return existing ?? null;
  }
  return data;
}

/**
 * Get the current user's profile, or redirect to /sign-in if signed out.
 * Use in Server Components for protected routes.
 *
 * The middleware also gates these routes — this is a defense-in-depth check
 * and ensures the profile is loaded for the layout.
 */
export async function requireProfile(nextPath = "/library"): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  return profile;
}
