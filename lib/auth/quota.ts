import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Per-day quota enforcement. Free tier gets 5 Q&A questions/day, 0 drafts.
 * Pro and Small Firm get unlimited.
 *
 * Counters reset daily — the `day` column in `quota_counters` is keyed on
 * the current PH calendar day (Asia/Manila). Anything past midnight in
 * Manila rolls into a new row.
 */

export type QuotaType = "qa" | "draft";
export type Plan = "free" | "pro" | "small_firm";

const LIMITS: Record<Plan, { qa: number | "unlimited"; draft: number | "unlimited" }> = {
  free: { qa: 5, draft: 0 },
  pro: { qa: "unlimited", draft: "unlimited" },
  small_firm: { qa: "unlimited", draft: "unlimited" },
};

export class QuotaExceededError extends Error {
  readonly type: QuotaType;
  readonly limit: number;
  readonly used: number;
  readonly plan: Plan;
  constructor(type: QuotaType, used: number, limit: number, plan: Plan) {
    super(
      `${type === "qa" ? "Q&A" : "Drafting"} quota exceeded (${used}/${limit}) on the ${plan} plan.`,
    );
    this.type = type;
    this.used = used;
    this.limit = limit;
    this.plan = plan;
    this.name = "QuotaExceededError";
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("Not signed in.");
    this.name = "UnauthenticatedError";
  }
}

/** Returns the calendar date in PH (Asia/Manila) as YYYY-MM-DD. */
function phToday(): string {
  // toLocaleDateString with timezone gives MM/DD/YYYY (en-US) — re-parse.
  const parts = new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [m, d, y] = parts.split("/");
  return `${y}-${m}-${d}`;
}

async function resolvePlan(userId: string): Promise<Plan> {
  const admin = createAdminClient();
  // Read profile to find firm membership; if any firm → use its plan.
  const { data: profile } = await admin
    .from("profiles")
    .select("id, full_name, firm_id, role")
    .eq("id", userId)
    .maybeSingle();
  const firmId = profile?.firm_id ?? null;
  if (!firmId) return "free";
  const { data: firm } = await admin
    .from("firms")
    .select("id, name, plan, created_at")
    .eq("id", firmId)
    .maybeSingle();
  return (firm?.plan as Plan | undefined) ?? "free";
}

/**
 * Atomically check the quota and increment the counter. Throws
 * QuotaExceededError if over limit. Returns the post-increment usage so
 * callers can surface "you have N left today" in the UI.
 */
export async function checkAndIncrementQuota(
  type: QuotaType,
): Promise<{ used: number; limit: number | "unlimited"; plan: Plan }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthenticatedError();

  const plan = await resolvePlan(user.id);
  const limit = LIMITS[plan][type];

  const admin = createAdminClient();
  const today = phToday();

  // Read current count.
  const { data: existing } = await admin
    .from("quota_counters")
    .select("qa_count, draft_count")
    .eq("user_id", user.id)
    .eq("day", today)
    .maybeSingle();

  const currentUsed = existing
    ? type === "qa"
      ? existing.qa_count
      : existing.draft_count
    : 0;

  if (limit !== "unlimited" && currentUsed >= limit) {
    throw new QuotaExceededError(type, currentUsed, limit as number, plan);
  }

  const newCount = currentUsed + 1;

  if (existing) {
    const update =
      type === "qa" ? { qa_count: newCount } : { draft_count: newCount };
    await admin
      .from("quota_counters")
      .update(update)
      .eq("user_id", user.id)
      .eq("day", today);
  } else {
    await admin.from("quota_counters").insert({
      user_id: user.id,
      day: today,
      qa_count: type === "qa" ? 1 : 0,
      draft_count: type === "draft" ? 1 : 0,
    });
  }

  return { used: newCount, limit, plan };
}

/** Read-only — used by the topbar to render remaining count. */
export async function getQuotaUsage(): Promise<{
  qa: { used: number; limit: number | "unlimited" };
  draft: { used: number; limit: number | "unlimited" };
  plan: Plan;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const plan = await resolvePlan(user.id);
  const admin = createAdminClient();
  const today = phToday();
  const { data: row } = await admin
    .from("quota_counters")
    .select("qa_count, draft_count")
    .eq("user_id", user.id)
    .eq("day", today)
    .maybeSingle();

  return {
    qa: { used: row?.qa_count ?? 0, limit: LIMITS[plan].qa },
    draft: { used: row?.draft_count ?? 0, limit: LIMITS[plan].draft },
    plan,
  };
}
