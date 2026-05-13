import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/topbar";
import { DraftWorkspace } from "../../_components/draft-workspace";
import { getDraft } from "@/lib/persist/drafts";
import { getTemplate } from "@/lib/draft/templates";
import { requireProfile } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const draft = await getDraft(id);
  if (!draft) return { title: "Draft — Ponente" };
  return { title: `${draft.title} · Ponente` };
}

export default async function SavedDraftPage({ params }: { params: Params }) {
  await requireProfile();
  const { id } = await params;
  const draft = await getDraft(id);
  if (!draft) notFound();
  const template = getTemplate(draft.template);
  if (!template) notFound();

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Library", href: "/library" },
          { label: draft.title },
        ]}
      />
      <DraftWorkspace
        template={template}
        initialDraftId={draft.id}
        initialFactsOverride={draft.facts}
        initialBody={draft.body}
        initialCitations={draft.citations}
        initialTitle={draft.title}
      />
    </>
  );
}
