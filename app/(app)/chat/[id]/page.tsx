import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/topbar";
import { ChatWorkspace } from "../_components/chat-workspace";
import { getChatWithMessages } from "@/lib/persist/chats";
import { requireProfile } from "@/lib/auth/session";
import type { Citation } from "@/lib/ai/events";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getChatWithMessages(id);
  if (!result) return { title: "Chat — Ponente" };
  return { title: `${result.chat.title} · Ponente` };
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function collectSources(
  messages: Array<{ citations: Citation[] }>,
): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const m of messages) {
    for (const c of m.citations) {
      if (seen.has(c.tag)) continue;
      seen.add(c.tag);
      out.push(c);
    }
  }
  return out;
}

export default async function ChatByIdPage({ params }: { params: Params }) {
  await requireProfile();
  const { id } = await params;
  const result = await getChatWithMessages(id);
  if (!result) notFound();
  const { chat, messages } = result;

  const initialThread = messages.map((m) => ({
    id: m.id,
    role: m.role,
    ts: hhmm(m.created_at),
    body: m.body,
  }));
  const initialSources = collectSources(messages);

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Library", href: "/library" },
          { label: chat.title },
        ]}
      />
      <ChatWorkspace
        initialChatId={chat.id}
        initialThread={initialThread}
        initialSources={initialSources}
      />
    </>
  );
}
