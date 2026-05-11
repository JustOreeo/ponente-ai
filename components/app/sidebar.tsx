import Link from "next/link";
import { LogoMarkColumn } from "@/components/logo";
import type { Profile } from "@/lib/auth/session";
import type { FirmContext } from "@/lib/auth/firm";

type Item = { label: string; href: string; kbd?: string };

function initialsOf(name: string | null | undefined): string {
  if (!name) return "—";
  const parts = name
    .replace(/^Atty\.?\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PRIMARY: Item[] = [
  { label: "New chat", href: "/chat", kbd: "⌘K" },
  { label: "New draft", href: "/draft/new", kbd: "⌘D" },
  { label: "Library", href: "/library" },
];

const TEMPLATES: Item[] = [
  { label: "Demand Letter", href: "/draft/demand" },
  { label: "Affidavit of Loss", href: "/draft/affidavit" },
  { label: "NLRC Position Paper", href: "/draft/nlrc" },
  { label: "Motion for Reconsideration", href: "/draft/mr" },
  { label: "Verified Petition", href: "/draft/petition" },
];

export function Sidebar({
  profile,
  firmContext,
}: {
  profile: Profile;
  firmContext: FirmContext | null;
}) {
  const displayName = profile.full_name || "Member";
  const initials = initialsOf(profile.full_name);
  const isAdmin = firmContext?.role === "admin";
  const planLine = firmContext
    ? `${firmContext.firm.name}${isAdmin ? " · admin" : ""}`
    : "Free · Solo";

  return (
    <aside
      className="bg-ink text-parchment flex flex-col"
      style={{ width: 256, height: "100vh", position: "sticky", top: 0 }}
    >
      {/* Brand */}
      <Link
        href="/library"
        className="flex items-center gap-[10px] text-parchment no-underline px-5 py-5 border-b"
        style={{ borderColor: "rgba(245,239,226,0.1)" }}
      >
        <LogoMarkColumn size={24} color="var(--color-parchment)" />
        <span className="font-serif text-[20px] font-medium tracking-[-0.018em]">
          Ponente
        </span>
      </Link>

      {/* Primary nav */}
      <div className="px-3 py-4">
        {PRIMARY.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center justify-between gap-3 px-3 py-[7px] text-[13.5px] text-parchment no-underline rounded-[3px] hover:bg-[rgba(245,239,226,0.08)] transition-colors"
          >
            <span>{it.label}</span>
            {it.kbd && (
              <span
                className="font-mono text-[10px] tracking-[0.04em]"
                style={{ color: "rgba(245,239,226,0.55)" }}
              >
                {it.kbd}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Templates */}
      <div className="px-3 py-2">
        <div
          className="px-3 py-2 font-mono text-[10px] tracking-[0.16em] uppercase"
          style={{ color: "rgba(245,239,226,0.45)" }}
        >
          Templates
        </div>
        {TEMPLATES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="flex items-center px-3 py-[6px] text-[13px] no-underline rounded-[3px] hover:bg-[rgba(245,239,226,0.08)] transition-colors"
            style={{ color: "rgba(245,239,226,0.78)" }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Admin (firm admins only) */}
      {isAdmin && (
        <div className="px-3 py-2">
          <div
            className="px-3 py-2 font-mono text-[10px] tracking-[0.16em] uppercase"
            style={{ color: "rgba(245,239,226,0.45)" }}
          >
            Firm
          </div>
          <Link
            href="/admin"
            className="flex items-center px-3 py-[6px] text-[13px] no-underline rounded-[3px] hover:bg-[rgba(245,239,226,0.08)] transition-colors"
            style={{ color: "rgba(245,239,226,0.78)" }}
          >
            Admin · settings
          </Link>
          <Link
            href="/admin/seats"
            className="flex items-center px-3 py-[6px] text-[13px] no-underline rounded-[3px] hover:bg-[rgba(245,239,226,0.08)] transition-colors"
            style={{ color: "rgba(245,239,226,0.78)" }}
          >
            Seats
          </Link>
        </div>
      )}

      {/* Solo users get a subtle "Start a firm" prompt */}
      {!firmContext && (
        <div className="px-3 py-2">
          <Link
            href="/admin"
            className="flex items-center px-3 py-[6px] text-[13px] no-underline rounded-[3px] hover:bg-[rgba(245,239,226,0.08)] transition-colors"
            style={{ color: "rgba(245,239,226,0.55)" }}
          >
            + Start a firm
          </Link>
        </div>
      )}

      <div className="flex-1" />

      {/* Bottom: account */}
      <div
        className="border-t px-3 py-4"
        style={{ borderColor: "rgba(245,239,226,0.1)" }}
      >
        <div className="flex items-center gap-3 px-3 py-2 rounded-[3px]">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center font-serif font-medium text-ink text-[13px]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-parchment truncate">
              {displayName}
            </div>
            <div
              className="font-mono text-[10.5px] tracking-[0.04em] truncate"
              style={{ color: "rgba(245,239,226,0.55)" }}
            >
              {planLine}
            </div>
          </div>
        </div>
        <form action="/api/auth/signout" method="post" className="px-3 mt-1">
          <button
            type="submit"
            className="font-mono text-[10.5px] tracking-[0.14em] uppercase bg-transparent border-0 cursor-pointer hover:text-parchment transition-colors"
            style={{ color: "rgba(245,239,226,0.55)" }}
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
