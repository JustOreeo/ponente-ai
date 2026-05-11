import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

type FooterLink = { label: string; href: string };
type FooterCol = { head: string; items: FooterLink[] };

const COLS: FooterCol[] = [
  {
    head: "Product",
    items: [
      { label: "Drafting", href: "/drafting" },
      { label: "Q&A", href: "/qa" },
      { label: "Citations", href: "/citations" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    head: "For firms",
    items: [
      { label: "Small Firm plan", href: "/pricing#small-firm" },
      { label: "SSO & admin", href: "/for-firms#sso" },
      { label: "Onboarding", href: "/for-firms#onboarding" },
    ],
  },
  {
    head: "Resources",
    items: [
      { label: "Templates", href: "/drafting#templates" },
      { label: "Citation guide", href: "/citations#guide" },
      { label: "Changelog", href: "/about#changelog" },
    ],
  },
  {
    head: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink text-parchment px-6 sm:px-10 lg:px-14 pt-10 lg:pt-12 pb-7">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-7 lg:mb-9 gap-4">
        <Link href="/" className="text-parchment no-underline">
          <Wordmark size={56} className="lg:[font-size:64px]" />
        </Link>
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-gold">
          Manila · Philippines
        </div>
      </div>
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-[13px] pt-6 lg:pt-7"
        style={{
          color: "rgba(245,239,226,0.75)",
          borderTop: "1px solid rgba(245,239,226,0.15)",
        }}
      >
        {COLS.map((col) => (
          <div key={col.head}>
            <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-gold mb-3">
              {col.head}
            </div>
            {col.items.map((it) => (
              <div key={it.label} className="py-1">
                <Link
                  href={it.href}
                  className="text-inherit no-underline hover:text-parchment transition-colors"
                >
                  {it.label}
                </Link>
              </div>
            ))}
          </div>
        ))}
      </div>
      <p
        className="mt-7 lg:mt-9 text-[11px] italic max-w-[720px] m-0"
        style={{ color: "rgba(245,239,226,0.55)" }}
      >
        Ponente is a drafting and research aid. It is not a substitute for a
        licensed attorney. Verify every cited source before relying on output
        in pleadings or filings.
      </p>
    </footer>
  );
}
