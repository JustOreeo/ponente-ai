import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Citation } from "@/lib/ai/events";

export type DraftTemplate = "demand" | "affidavit" | "nlrc" | "mr" | "petition";
export type DraftStatus = "drafting" | "review" | "final";

export type DraftRow = {
  id: string;
  user_id: string;
  firm_id: string | null;
  template: DraftTemplate;
  title: string;
  facts: Record<string, string>;
  body: string;
  citations: Citation[];
  status: DraftStatus;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

function rowToDraft(r: {
  id: string;
  user_id: string;
  firm_id: string | null;
  template: DraftTemplate;
  title: string;
  facts: unknown;
  body: string;
  citations: unknown;
  status: DraftStatus;
  archived: boolean;
  created_at: string;
  updated_at: string;
}): DraftRow {
  return {
    ...r,
    facts:
      r.facts && typeof r.facts === "object" && !Array.isArray(r.facts)
        ? (r.facts as Record<string, string>)
        : {},
    citations: Array.isArray(r.citations)
      ? (r.citations as unknown as Citation[])
      : [],
  };
}

export async function listDrafts(opts: { limit?: number } = {}): Promise<DraftRow[]> {
  const limit = opts.limit ?? 50;
  const supabase = await createClient();
  const { data } = await supabase
    .from("drafts")
    .select(
      "id, user_id, firm_id, template, title, facts, body, citations, status, archived, created_at, updated_at",
    )
    .eq("archived", false)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(rowToDraft);
}

export async function getDraft(draftId: string): Promise<DraftRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("drafts")
    .select(
      "id, user_id, firm_id, template, title, facts, body, citations, status, archived, created_at, updated_at",
    )
    .eq("id", draftId)
    .maybeSingle();
  return data ? rowToDraft(data) : null;
}

export async function createDraft(opts: {
  userId: string;
  template: DraftTemplate;
  title?: string;
  facts?: Record<string, string>;
  body?: string;
  citations?: Citation[];
  status?: DraftStatus;
}): Promise<DraftRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("drafts")
    .insert({
      user_id: opts.userId,
      template: opts.template,
      title: opts.title?.trim() || draftTitle(opts.template),
      facts: (opts.facts ?? {}) as unknown as Json,
      body: opts.body ?? "",
      citations: (opts.citations ?? []) as unknown as Json,
      status: opts.status ?? "drafting",
    })
    .select(
      "id, user_id, firm_id, template, title, facts, body, citations, status, archived, created_at, updated_at",
    )
    .single();
  if (error || !data) {
    throw new Error(`createDraft failed: ${error?.message}`);
  }
  return rowToDraft(data);
}

export async function patchDraft(
  draftId: string,
  patch: Partial<{
    title: string;
    facts: Record<string, string>;
    body: string;
    citations: Citation[];
    status: DraftStatus;
    firm_id: string | null;
    archived: boolean;
  }>,
): Promise<void> {
  const supabase = await createClient();
  // Strip undefined keys so Supabase doesn't try to update nothing.
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) cleaned[k] = v;
  }
  const { error } = await supabase
    .from("drafts")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(cleaned as any)
    .eq("id", draftId);
  if (error) throw new Error(`patchDraft failed: ${error.message}`);
}

export async function deleteDraft(draftId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("drafts").delete().eq("id", draftId);
  if (error) throw new Error(`deleteDraft failed: ${error.message}`);
}

function draftTitle(template: DraftTemplate): string {
  const map: Record<DraftTemplate, string> = {
    demand: "Demand Letter",
    affidavit: "Affidavit of Loss",
    nlrc: "NLRC Position Paper",
    mr: "Motion for Reconsideration",
    petition: "Verified Petition",
  };
  return `Untitled ${map[template]}`;
}

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
