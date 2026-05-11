import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/app/topbar";
import { requireProfile } from "@/lib/auth/session";
import { getFirmContext } from "@/lib/auth/firm";
import { CreateFirmForm } from "./_components/create-firm-form";
import { FirmSettingsForm } from "./_components/firm-settings-form";

export const metadata: Metadata = {
  title: "Admin — Ponente",
};

export default async function AdminPage() {
  await requireProfile("/admin");
  const ctx = await getFirmContext();

  if (!ctx) {
    return (
      <>
        <Topbar crumbs={[{ label: "Admin" }]} />
        <div className="px-6 sm:px-10 py-8 max-w-[680px]">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
            Firms
          </div>
          <h1
            className="font-serif text-[28px] sm:text-[32px] font-normal m-0 mb-2"
            style={{ letterSpacing: "-0.018em" }}
          >
            Start a firm.
          </h1>
          <p className="text-[14.5px] text-ink-soft m-0 mb-8 leading-[1.55]">
            A firm is a shared workspace for 3 or more lawyers. You become its
            first admin — invite others, manage seats, switch plan when ready.
          </p>
          <CreateFirmForm />
        </div>
      </>
    );
  }

  if (ctx.role !== "admin") {
    return (
      <>
        <Topbar crumbs={[{ label: "Admin" }]} />
        <div className="px-6 sm:px-10 py-8 max-w-[680px]">
          <h1
            className="font-serif text-[28px] sm:text-[32px] font-normal m-0 mb-2"
            style={{ letterSpacing: "-0.018em" }}
          >
            Members can't manage the firm.
          </h1>
          <p className="text-[14.5px] text-ink-soft m-0 leading-[1.55]">
            You're a member of <strong>{ctx.firm.name}</strong>. Only firm
            admins can manage seats and settings. If you need a change, ask
            your admin.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        crumbs={[{ label: "Admin" }]}
        right={
          <Link href="/admin/seats" className="no-underline">
            <span className="bg-ink text-parchment px-3 py-[6px] font-sans text-[12px] font-medium rounded-[2px]">
              Manage seats →
            </span>
          </Link>
        }
      />
      <div className="px-6 sm:px-10 py-8 max-w-[760px]">
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
          {ctx.firm.plan === "small_firm"
            ? "Small Firm"
            : ctx.firm.plan === "pro"
              ? "Pro"
              : "Free"}{" "}
          plan
        </div>
        <h1
          className="font-serif text-[28px] sm:text-[32px] font-normal m-0 mb-2"
          style={{ letterSpacing: "-0.018em" }}
        >
          {ctx.firm.name}
        </h1>
        <p className="text-[14.5px] text-ink-soft m-0 mb-8 leading-[1.55]">
          You're an admin. Invite teammates, change roles, or rename the firm
          here. Billing + seat counts come online once Paymongo is wired.
        </p>

        <FirmSettingsForm firm={ctx.firm} />
      </div>
    </>
  );
}
