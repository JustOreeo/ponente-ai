import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listChats } from "@/lib/persist/chats";
import { listDrafts } from "@/lib/persist/drafts";

export const runtime = "nodejs";

/**
 * GET — unified library: recent chats + drafts merged, sorted by updated_at.
 * Returns 200 with `{items: []}` even when signed out (empty library).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 200 });

  const [chats, drafts] = await Promise.all([listChats(), listDrafts()]);

  const items = [
    ...chats.map((c) => ({
      kind: "chat" as const,
      id: c.id,
      title: c.title,
      updated_at: c.updated_at,
      meta: {
        practice_areas: c.practice_areas,
      },
    })),
    ...drafts.map((d) => ({
      kind: "draft" as const,
      id: d.id,
      title: d.title,
      updated_at: d.updated_at,
      meta: {
        template: d.template,
        status: d.status,
        citation_count: Array.isArray(d.citations) ? d.citations.length : 0,
      },
    })),
  ].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return NextResponse.json({ items }, { status: 200 });
}
