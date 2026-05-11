import { Sidebar } from "@/components/app/sidebar";
import { requireProfile } from "@/lib/auth/session";
import { getFirmContext } from "@/lib/auth/firm";

// These pages render per-user content; never prerender them statically.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const firmContext = await getFirmContext();
  return (
    <div className="flex bg-parchment text-ink min-h-screen">
      <Sidebar profile={profile} firmContext={firmContext} />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
