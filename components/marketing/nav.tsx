import Link from "next/link";
import { LogoMarkColumn } from "@/components/logo";
import { BtnPrimary } from "@/components/buttons";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Drafting", href: "/drafting" },
  { label: "Q&A", href: "/qa" },
  { label: "Citations", href: "/citations" },
  { label: "Pricing", href: "/pricing" },
  { label: "For firms", href: "/for-firms" },
];

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-14 py-5 border-b border-line-soft">
      <Link href="/" className="flex items-center gap-[10px] text-ink no-underline">
        <LogoMarkColumn size={28} color="var(--color-ink)" />
        <span className="font-serif text-[22px] font-medium tracking-[-0.018em]">
          Ponente
        </span>
      </Link>
      <div className="flex gap-7 text-[13.5px] text-ink-soft">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-ink-soft hover:text-ink no-underline transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex gap-[10px] items-center">
        <Link
          href="/sign-in"
          className="text-[13.5px] text-ink-soft hover:text-ink no-underline transition-colors"
        >
          Sign in
        </Link>
        <Link href="/sign-up" className="no-underline">
          <BtnPrimary small>Start free</BtnPrimary>
        </Link>
      </div>
    </nav>
  );
}
