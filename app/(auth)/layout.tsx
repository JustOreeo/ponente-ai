import Link from "next/link";
import { LogoMarkColumn } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="min-h-screen bg-parchment text-ink grid"
      style={{ gridTemplateRows: "auto 1fr auto" }}
    >
      {/* Minimal top bar — just logo back to / */}
      <header className="px-14 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-[10px] text-ink no-underline"
        >
          <LogoMarkColumn size={26} color="var(--color-ink)" />
          <span className="font-serif text-[20px] font-medium tracking-[-0.018em]">
            Ponente
          </span>
        </Link>
      </header>

      <div className="flex items-center justify-center px-6">
        <div className="w-full max-w-[440px]">{children}</div>
      </div>

      <footer className="px-14 py-6 flex items-center justify-between text-[12px] text-muted font-mono tracking-[0.04em]">
        <span>Manila · 2026</span>
        <span className="flex gap-4">
          <Link href="/privacy" className="text-muted no-underline hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted no-underline hover:text-ink">
            Terms
          </Link>
        </span>
      </footer>
    </main>
  );
}
