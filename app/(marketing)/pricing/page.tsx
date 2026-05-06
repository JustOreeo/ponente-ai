import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { PricingGrid, TIERS } from "@/components/marketing/pricing-grid";
import { BtnLight } from "@/components/buttons";

export const metadata: Metadata = {
  title: "Pricing — Ponente",
  description:
    "Ponente plans for solo lawyers and small firms. Free for 5 questions per day. Pro from ₱1,499/month.",
};

type MatrixRow = readonly [
  feature: string,
  free: boolean | string,
  pro: boolean | string,
  firm: boolean | string,
];

const MATRIX: MatrixRow[] = [
  ["Q&A questions / day", "5", "Unlimited", "Unlimited"],
  ["Drafting templates", false, "All 5", "All 5"],
  ["Citation panel", "Read-only", true, true],
  [".docx export", false, true, true],
  ["Verified PH-only sources", true, true, true],
  ["Document history", "7 days", "Unlimited", "Unlimited"],
  ["Team library + sharing", false, false, true],
  ["Admin & seat management", false, false, true],
  ["SSO (Google Workspace)", false, false, true],
  ["Priority support", false, "Email", "Email + Slack"],
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade or downgrade at any time. Pro and Small Firm bill monthly; Small Firm is annual-only at the listed rate.",
  },
  {
    q: "Do you charge in PHP?",
    a: "All prices are in Philippine pesos. We collect via Paymongo (cards, GCash, Maya). VAT is included.",
  },
  {
    q: "What counts as a 'question' on Free?",
    a: "Each Q&A turn — your message + Ponente's reply with citations — counts as one question. Drafting is not available on Free.",
  },
  {
    q: "Is there a free trial of Pro?",
    a: "Pro is month-to-month with no contract. Cancel before the next billing date and you won't be charged again.",
  },
  {
    q: "How do firm seats work?",
    a: "Small Firm starts at 3 seats and bills annually at ₱1,199 per seat per month. Add or remove seats at the next renewal.",
  },
];

function Mark({ v }: { v: boolean | string }) {
  if (v === true) return <span className="text-success font-mono">✓</span>;
  if (v === false) return <span className="text-muted font-mono">—</span>;
  return <span className="text-ink text-[13px]">{v}</span>;
}

export default function PricingPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Pricing"
        headline={
          <>
            Pricing for solo and{" "}
            <em className="italic text-accent">small firms.</em>
          </>
        }
        sub="Free for daily Q&A. Pro for unlimited drafting. Small Firm for teams that need a shared library, admin, and SSO."
      />

      <section style={{ padding: "0 56px 24px" }}>
        <PricingGrid />
        <p className="mt-4 text-[13px] text-muted">
          All prices in PHP. Paymongo: cards, GCash, Maya. VAT included.
        </p>
      </section>

      {/* Feature matrix */}
      <section style={{ padding: "72px 56px 48px" }}>
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          Compare in detail
        </div>
        <h2
          className="font-serif text-[36px] font-normal m-0 mb-10"
          style={{ letterSpacing: "-0.015em" }}
        >
          What&apos;s in each plan.
        </h2>
        <div className="border border-line">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] bg-surface border-b border-line">
            <div className="px-5 py-4 font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted">
              Feature
            </div>
            {TIERS.map((t) => (
              <div
                key={t.slug}
                className="px-5 py-4 font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted border-l border-line"
                style={{
                  color: t.highlight
                    ? "var(--color-accent)"
                    : "var(--color-muted)",
                  fontWeight: t.highlight ? 600 : 500,
                }}
              >
                {t.name}
              </div>
            ))}
          </div>
          {MATRIX.map(([feature, ...vals], i) => (
            <div
              key={feature}
              className={`grid grid-cols-[1.6fr_1fr_1fr_1fr] ${
                i < MATRIX.length - 1 ? "border-b border-line-soft" : ""
              }`}
            >
              <div className="px-5 py-3 text-[14px] text-ink-soft">
                {feature}
              </div>
              {vals.map((v, idx) => (
                <div
                  key={idx}
                  className="px-5 py-3 text-[13.5px] text-ink border-l border-line"
                >
                  <Mark v={v} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "48px 56px 88px" }}>
        <div className="grid grid-cols-[1fr_2fr] gap-14 border-t border-line pt-14">
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
              FAQ
            </div>
            <h2
              className="font-serif text-[36px] font-normal m-0"
              style={{ letterSpacing: "-0.015em", lineHeight: 1.05 }}
            >
              Common questions.
            </h2>
            <p className="mt-4 text-[14px] text-muted leading-[1.55] max-w-[280px]">
              Something else?{" "}
              <Link
                href="/contact"
                className="text-accent no-underline"
              >
                Talk to us →
              </Link>
            </p>
          </div>
          <div>
            {FAQ.map((f, i) => (
              <div
                key={f.q}
                className={`py-6 ${
                  i < FAQ.length - 1 ? "border-b border-line-soft" : ""
                }`}
              >
                <div className="font-serif text-[20px] text-ink mb-2">
                  {f.q}
                </div>
                <div className="text-[14.5px] text-ink-soft leading-[1.6]">
                  {f.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-ink text-parchment" style={{ padding: "72px 56px" }}>
        <div className="flex items-center justify-between gap-8">
          <h2
            className="font-serif text-[40px] font-normal m-0 max-w-[600px] text-parchment"
            style={{ letterSpacing: "-0.018em", lineHeight: 1.08 }}
          >
            Start free.{" "}
            <em className="italic text-gold">Upgrade when you draft.</em>
          </h2>
          <Link href="/sign-up" className="no-underline shrink-0">
            <BtnLight>Create account →</BtnLight>
          </Link>
        </div>
      </section>
    </>
  );
}
