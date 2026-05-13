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
          { label: "Library", href: "/library" },
          { label: "New chat" },
        ]}
      />
      <ChatWorkspace />
    </>
  );
}
