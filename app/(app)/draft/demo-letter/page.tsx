import type { Metadata } from "next";
import { Topbar } from "@/components/app/topbar";
import { DraftWorkspace } from "./_components/draft-workspace";

export const metadata: Metadata = {
  title: "Demand to Globe Telecom — Ponente",
};

export default function DemoLetterPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Library", href: "/library" },
          { label: "Demand to Globe Telecom" },
        ]}
        right={
          <button
            type="button"
            className="bg-ink text-parchment px-3 py-[6px] font-sans text-[12px] font-medium rounded-[2px] cursor-pointer"
          >
            Export .docx ↓
          </button>
        }
      />
      <DraftWorkspace />
    </>
  );
}
