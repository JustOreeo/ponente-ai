import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    .single();

  return profile ?? null;
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
