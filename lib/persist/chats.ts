import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Citation } from "@/lib/ai/events";

export type ChatRow = {
  id: string;
  user_id: string;
  firm_id: string | null;
  title: string;
  practice_areas: string[];
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatMessageRow = {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  body: string;
  citations: Citation[];
  created_at: string;
};

/** List the caller's chats (most recent first). */
export async function listChats(opts: { limit?: number } = {}): Promise<ChatRow[]> {
  const limit = opts.limit ?? 50;
  const supabase = await createClient();
  const { data } = await supabase
    .from("chats")
    .select("id, user_id, firm_id, title, practice_areas, archived, created_at, updated_at")
    .eq("archived", false)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ChatRow[];
}

export async function getChatWithMessages(
  chatId: string,
): Promise<{ chat: ChatRow; messages: ChatMessageRow[] } | null> {
  const supabase = await createClient();
  const { data: chat } = await supabase
    .from("chats")
    .select("id, user_id, firm_id, title, practice_areas, archived, created_at, updated_at")
    .eq("id", chatId)
    .maybeSingle();
  if (!chat) return null;
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id, chat_id, role, body, citations, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  return {
    chat: chat as ChatRow,
    messages: (messages ?? []).map((m) => ({
      ...m,
      citations: Array.isArray(m.citations) ? (m.citations as unknown as Citation[]) : [],
    })) as ChatMessageRow[],
  };
}

/** Create a new chat (insert). Caller must be authenticated. */
export async function createChat(opts: {
  userId: string;
  title?: string;
  practiceAreas?: string[];
}): Promise<ChatRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chats")
    .insert({
      user_id: opts.userId,
      title: opts.title?.trim() || "New chat",
      practice_areas: opts.practiceAreas ?? [],
    })
    .select("id, user_id, firm_id, title, practice_areas, archived, created_at, updated_at")
    .single();
  if (error || !data) {
    throw new Error(`createChat failed: ${error?.message}`);
  }
  return data as ChatRow;
}

/** Append a message. Bumps chats.updated_at via trigger. */
export async function appendMessage(opts: {
  chatId: string;
  role: "user" | "assistant";
  body: string;
  citations?: Citation[];
}): Promise<ChatMessageRow> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chat_messages")
    .insert({
      chat_id: opts.chatId,
      role: opts.role,
      body: opts.body,
      citations: (opts.citations ?? []) as unknown as Json,
    })
    .select("id, chat_id, role, body, citations, created_at")
    .single();
  if (error || !data) {
    throw new Error(`appendMessage failed: ${error?.message}`);
  }
  return {
    ...data,
    citations: Array.isArray(data.citations)
      ? (data.citations as unknown as Citation[])
      : [],
  } as ChatMessageRow;
}

export async function patchChat(
  chatId: string,
  patch: Partial<{
    title: string;
    practice_areas: string[];
    archived: boolean;
    firm_id: string | null;
  }>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chats")
    .update(patch)
    .eq("id", chatId);
  if (error) throw new Error(`patchChat failed: ${error.message}`);
}

export async function deleteChat(chatId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("chats").delete().eq("id", chatId);
  if (error) throw new Error(`deleteChat failed: ${error.message}`);
}

// Local Json alias to avoid pulling the full Database import into this module.
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
