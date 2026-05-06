import Link from "next/link";
import { LogoMarkColumn } from "@/components/logo";

type Item = { label: string; href: string; kbd?: string };

const PRIMARY: Item[] = [
  { label: "New chat", href: "/chat", kbd: "⌘K" },
  { label: "New draft", href: "/draft/new", kbd: "⌘D" },
  { label: "Library", href: "/library" },
];

const TEMPLATES: Item[] = [
  { label: "Demand Letter", href: "/draft/new?t=demand" },
  { label: "Affidavit of Loss", href: "/draft/new?t=affidavit" },
  { label: "NLRC Position Paper", href: "/draft/new?t=nlrc" },
  { label: "Motion for Reconsideration", href: "/draft/new?t=mr" },
  { label: "Verified Petition", href: "/draft/new?t=petition" },
];

export function Sidebar() {
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

      <div className="flex-1" />

      {/* Bottom: account */}
      <div
        className="border-t px-3 py-4"
        style={{ borderColor: "rgba(245,239,226,0.1)" }}
      >
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 no-underline rounded-[3px] hover:bg-[rgba(245,239,226,0.08)] transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center font-serif font-medium text-ink text-[13px]">
            MR
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-parchment truncate">
              Atty. Maria Reyes
            </div>
            <div
              className="font-mono text-[10.5px] tracking-[0.04em] truncate"
              style={{ color: "rgba(245,239,226,0.55)" }}
            >
              Pro · Solo
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
