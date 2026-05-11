import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/app/topbar";
import { DraftWorkspace } from "../_components/draft-workspace";
import { getTemplate, TEMPLATES } from "@/lib/draft/templates";

type Params = Promise<{ template: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { template: slug } = await params;
  const tpl = getTemplate(slug);
  if (!tpl) return { title: "Draft — Ponente" };
  return { title: `${tpl.name} — Ponente` };
}

// Pre-render shells for the 5 known templates; auth gate still applies.
export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ template: t.slug }));
}

export default async function TemplateDraftPage({
  params,
}: {
  params: Params;
}) {
  const { template: slug } = await params;
  const tpl = getTemplate(slug);
  if (!tpl) notFound();

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Library", href: "/library" },
          { label: "New draft", href: "/draft/new" },
          { label: tpl.name },
        ]}
      />
      <DraftWorkspace template={tpl} />
    </>
  );
}
