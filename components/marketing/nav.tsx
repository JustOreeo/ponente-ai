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
    <nav className="flex items-center justify-between px-6 sm:px-10 lg:px-14 py-4 lg:py-5 border-b border-line-soft gap-4">
      <Link
        href="/"
        className="flex items-center gap-[10px] text-ink no-underline shrink-0"
      >
        <LogoMarkColumn size={28} color="var(--color-ink)" />
        <span className="font-serif text-[20px] sm:text-[22px] font-medium tracking-[-0.018em]">
          Ponente
        </span>
      </Link>
      {/* Nav links — hidden below lg to keep the bar compact on mobile */}
      <div className="hidden lg:flex gap-7 text-[13.5px] text-ink-soft">
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
          className="hidden sm:inline text-[13.5px] text-ink-soft hover:text-ink no-underline transition-colors"
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
