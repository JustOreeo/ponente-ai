import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { BenefitGrid } from "@/components/marketing/benefit-grid";
import { PricingGrid, TIERS } from "@/components/marketing/pricing-grid";
import { BtnPrimary, BtnLight } from "@/components/buttons";

export const metadata: Metadata = {
  title: "For firms — Ponente",
  description:
    "Small Firm: shared library, admin, SSO, annual seat pricing. Built for the way Philippine small firms actually work.",
};

const TEAM_BENEFITS = [
  {
    num: "01",
    tag: "Library",
    head: "One shared bench.",
    body: "Drafts, templates, and citation panels live in a firm-wide library. Seniors review, juniors learn — without emailing .docx files around.",
  },
  {
    num: "02",
    tag: "Admin",
    head: "Seat control.",
    body: "Add or remove members at renewal. Centralized billing. Audit log of who drafted what, when, and from which template.",
  },
  {
    num: "03",
    tag: "SSO",
    head: "Sign in with Google.",
    body: "Google Workspace SSO at the Small Firm tier. SAML on the roadmap for larger firms.",
  },
];

const smallFirmTier = TIERS.find((t) => t.slug === "small-firm")!;

export default function ForFirmsPage() {
  return (
    <>
      <MarketingHero
        eyebrow="For firms · 3+ seats"
        headline={
          <>
            Built for{" "}
            <em className="italic text-accent">small firms</em> that ship
            real work.
          </>
        }
        sub="The Small Firm plan adds a shared library, admin, and SSO — for the way Philippine 3-to-15-lawyer firms actually collaborate. Annual billing. Per-seat pricing."
        cta={
          <>
            <Link href="/contact" className="no-underline">
              <BtnPrimary>Talk to sales →</BtnPrimary>
            </Link>
            <Link
              href="#small-firm"
              className="no-underline text-[13.5px] text-muted px-3 py-[10px]"
            >
              See pricing
            </Link>
          </>
        }
      />

      <BenefitGrid
        title="What firms get."
        aside="Three things solo plans don't have. Designed with two boutique Manila firms during preview."
        items={TEAM_BENEFITS}
      />

      {/* SSO + admin block */}
      <section id="sso" style={{ padding: "88px 56px 72px" }}>
        <div className="grid grid-cols-2 gap-12 border-t border-line pt-14">
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
              Sign-on
            </div>
            <h2
              className="font-serif text-[32px] font-normal m-0 mb-4"
              style={{ letterSpacing: "-0.015em", lineHeight: 1.1 }}
            >
              Google Workspace SSO.
            </h2>
            <p className="text-[14.5px] text-ink-soft leading-[1.6] m-0 mb-4">
              Connect once. Members of your Workspace domain join the firm
              account on first sign-in. Removing a Workspace user removes
              their Ponente access.
            </p>
            <p className="text-[13px] text-muted leading-[1.55] m-0">
              SAML SSO (Okta, Azure AD) is on the roadmap — contact us if it
              gates your evaluation.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
              Admin
            </div>
            <h2
              className="font-serif text-[32px] font-normal m-0 mb-4"
              style={{ letterSpacing: "-0.015em", lineHeight: 1.1 }}
            >
              The basics. Done well.
            </h2>
            <ul className="list-none p-0 m-0 text-[14px] text-ink-soft leading-[1.6]">
              {[
                "Centralized billing — one invoice, your firm name on it",
                "Member roles: admin, member",
                "Audit log: drafts, exports, citation lookups",
                "Per-member usage caps (optional)",
                "Off-boarding wipes drafts; firm library retained",
              ].map((line) => (
                <li
                  key={line}
                  className="flex gap-3 items-start py-[6px] border-b border-line-soft"
                >
                  <span className="text-accent font-mono text-[12px] mt-[2px]">
                    ·
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing card spotlight */}
      <section style={{ padding: "0 56px 88px" }}>
        <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
          Pricing
        </div>
        <h2
          className="font-serif text-[36px] font-normal m-0 mb-10"
          style={{ letterSpacing: "-0.015em" }}
        >
          Small Firm — {smallFirmTier.price}{" "}
          <span className="text-muted text-[20px]">{smallFirmTier.sub}</span>
        </h2>
        <PricingGrid />
        <p className="mt-4 text-[13px] text-muted">
          Small Firm is annual-only and starts at 3 seats. Need an MSA, NDA,
          or specific data-residency terms?{" "}
          <Link href="/contact" className="text-accent no-underline">
            Get in touch
          </Link>
          .
        </p>
      </section>

      {/* Onboarding section */}
      <section id="onboarding" style={{ padding: "0 56px 88px" }}>
        <div className="grid grid-cols-[1fr_2fr] gap-14 border-t border-line pt-14">
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
              Onboarding
            </div>
            <h2
              className="font-serif text-[32px] font-normal m-0"
              style={{ letterSpacing: "-0.015em", lineHeight: 1.1 }}
            >
              We set you up in a week.
            </h2>
          </div>
          <div className="text-[15px] text-ink-soft leading-[1.65]">
            <p className="m-0 mb-4">
              A single onboarding call with the founders. We provision the
              firm account, connect SSO, import your first batch of facts and
              templates, and walk one senior partner through drafting a real
              demand letter or position paper.
            </p>
            <p className="m-0">
              Your firm is live by end of week. We don&apos;t sell training
              packages — the product is supposed to teach itself.
            </p>
          </div>
        </div>
      </section>

      <section
        className="bg-ink text-parchment"
        style={{ padding: "72px 56px" }}
      >
        <div className="flex items-center justify-between gap-8">
          <h2
            className="font-serif text-[40px] font-normal m-0 max-w-[640px] text-parchment"
            style={{ letterSpacing: "-0.018em", lineHeight: 1.08 }}
          >
            Outfit your firm with{" "}
            <em className="italic text-gold">Ponente.</em>
          </h2>
          <Link href="/contact" className="no-underline shrink-0">
            <BtnLight>Talk to sales →</BtnLight>
          </Link>
        </div>
      </section>
    </>
  );
}
