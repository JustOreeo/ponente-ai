import { Sidebar } from "@/components/app/sidebar";
import { requireProfile } from "@/lib/auth/session";

// These pages render per-user content; never prerender them statically.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  return (
    <div className="flex bg-parchment text-ink min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
