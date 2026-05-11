import type { Metadata } from "next";
import { Topbar } from "@/components/app/topbar";
import { requireFirmAdmin, listFirmMembers, listFirmInvites } from "@/lib/auth/firm";
import { SeatsClient } from "./_components/seats-client";

export const metadata: Metadata = {
  title: "Seats — Ponente",
};

export default async function SeatsPage() {
  const { profile, context } = await requireFirmAdmin();
  const [members, invites] = await Promise.all([
    listFirmMembers(context.firm.id),
    listFirmInvites(context.firm.id),
  ]);

  return (
    <>
      <Topbar
        crumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Seats" },
        ]}
      />
      <div className="px-6 sm:px-10 py-8 max-w-[920px]">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
          {context.firm.name} · seats
        </div>
        <h1
          className="font-serif text-[28px] sm:text-[32px] font-normal m-0 mb-2"
          style={{ letterSpacing: "-0.018em" }}
        >
          Members & invites.
        </h1>
        <p className="text-[14.5px] text-ink-soft m-0 mb-8 leading-[1.55]">
          Invite by email. Share the generated link via your own email — we'll
          wire automated invite emails once Resend is set up.
        </p>

        <SeatsClient
          currentUserId={profile.id}
          members={members}
          initialInvites={invites}
        />
      </div>
    </>
  );
}
