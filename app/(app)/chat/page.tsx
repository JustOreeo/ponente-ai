import type { Metadata } from "next";
import { Topbar } from "@/components/app/topbar";
import { ChatWorkspace } from "./_components/chat-workspace";

export const metadata: Metadata = {
  title: "Chat — Ponente",
};

export default function ChatPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Chat", href: "/chat" },
          { label: "Advance rent under R.A. 9653" },
        ]}
        right={
          <span className="font-mono text-[10.5px] text-muted tracking-[0.06em]">
            3 / 5 today
          </span>
        }
      />
      <ChatWorkspace />
    </>
  );
}
