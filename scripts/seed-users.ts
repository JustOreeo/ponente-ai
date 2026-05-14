/**
 * scripts/seed-users.ts
 *
 * Seeds two test accounts and a firm. Idempotent — safe to re-run.
 *
 *   admin@ponente.ai / Admin@123!   → firm admin
 *   user@ponente.ai  / User@123!    → firm member
 *
 * Both users have email_confirm=true so they can sign in via the password
 * route immediately (no OTP needed).
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/seed-users.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";

type SeedUser = {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "member";
};

const FIRM_NAME = "Ponente Test Firm";

const USERS: SeedUser[] = [
  {
    email: "admin@ponente.ai",
    password: "Admin@123!",
    fullName: "Ponente Admin",
    role: "admin",
  },
  {
    email: "user@ponente.ai",
    password: "User@123!",
    fullName: "Ponente User",
    role: "member",
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Run with: npx tsx --env-file=.env.local scripts/seed-users.ts",
    );
  }

  const sb = createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const firmId = await ensureFirm(sb);
  console.log(`firm "${FIRM_NAME}" → ${firmId}`);

  for (const u of USERS) {
    const userId = await ensureUser(sb, u);
    await upsertProfile(sb, userId, u, firmId);
    console.log(`user ${u.email} → ${userId} (${u.role})`);
  }

  console.log("\nDone. Sign in at /sign-in?method=password");
}

async function ensureFirm(
  sb: ReturnType<typeof createClient<Database>>,
): Promise<string> {
  const { data: existing, error: selErr } = await sb
    .from("firms")
    .select("id")
    .eq("name", FIRM_NAME)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing.id;

  const { data, error } = await sb
    .from("firms")
    .insert({ name: FIRM_NAME, plan: "small_firm" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureUser(
  sb: ReturnType<typeof createClient<Database>>,
  u: SeedUser,
): Promise<string> {
  const existing = await findUserByEmail(sb, u.email);
  if (existing) {
    // Reset password + confirm email so the script reliably yields a
    // working account even if a previous run left it half-set-up.
    const { error } = await sb.auth.admin.updateUserById(existing, {
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    });
    if (error) throw error;
    return existing;
  }

  const { data, error } = await sb.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.fullName },
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  return data.user.id;
}

async function findUserByEmail(
  sb: ReturnType<typeof createClient<Database>>,
  email: string,
): Promise<string | null> {
  const target = email.toLowerCase();
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function upsertProfile(
  sb: ReturnType<typeof createClient<Database>>,
  userId: string,
  u: SeedUser,
  firmId: string,
) {
  // The handle_new_user trigger inserts a profile row on signup, but only
  // sets full_name. We always upsert here so re-runs converge to the
  // desired firm + role even if the trigger didn't fire (e.g., for users
  // created before the trigger existed).
  const { error } = await sb.from("profiles").upsert(
    {
      id: userId,
      full_name: u.fullName,
      firm_id: firmId,
      role: u.role,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
