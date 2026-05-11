import type { Metadata } from "next";
import { MarketingHero } from "@/components/marketing/marketing-hero";
import { BtnPrimary } from "@/components/buttons";

export const metadata: Metadata = {
  title: "Contact — Ponente",
  description: "Talk to the Ponente team. Manila, Philippines.",
};

const CONTACTS = [
  {
    label: "Sales · firms",
    detail: "sales@ponente.ph",
    sub: "Talk to a founder. Reply within one business day.",
  },
  {
    label: "Support",
    detail: "support@ponente.ph",
    sub: "Once you have an account, the in-app chat is faster.",
  },
  {
    label: "Press · partnerships",
    detail: "hello@ponente.ph",
    sub: "Speaking, podcasts, partnerships, anything else.",
  },
];

export default function ContactPage() {
  return (
    <>
      <MarketingHero
        eyebrow="Contact · Manila"
        headline={
          <>
            Talk to{" "}
            <em className="italic text-accent">the team.</em>
          </>
        }
        sub="We're a small group, mostly in Manila, sometimes in Luxembourg. Email gets through fastest. We answer every message that's not a sales pitch."
      />

      <section className="px-6 pb-12 sm:px-10 sm:pb-16 lg:px-14 lg:pb-[72px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 border-t border-line pt-10 lg:pt-14">
          {/* Channels */}
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
              Channels
            </div>
            <div className="border-t border-line">
              {CONTACTS.map((c) => (
                <div
                  key={c.label}
                  className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2 sm:gap-6 py-5 border-b border-line-soft sm:items-baseline"
                >
                  <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted">
                    {c.label}
                  </div>
                  <div>
                    <a
                      href={`mailto:${c.detail}`}
                      className="font-serif text-[18px] sm:text-[20px] text-ink no-underline hover:text-accent break-all"
                    >
                      {c.detail}
                    </a>
                    <div className="text-[13px] text-muted mt-1 leading-[1.55]">
                      {c.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <form
            className="bg-surface border border-line p-6 sm:p-8"
            action="/contact"
            method="get"
          >
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
              Or write us
            </div>
            <h2
              className="font-serif text-[24px] font-medium m-0 mb-6"
              style={{ letterSpacing: "-0.012em" }}
            >
              We read everything.
            </h2>

            <FormField label="Your name" placeholder="Atty. Maria Reyes" />
            <FormField
              label="Email"
              placeholder="maria@firm.com"
              type="email"
            />
            <FormField label="Firm" placeholder="Solo · Quezon City" />
            <FormField
              label="Message"
              placeholder="What's on your mind?"
              multiline
            />

            <div className="mt-6 flex items-center justify-between">
              <span className="text-[12px] text-muted">
                We reply within one business day.
              </span>
              <BtnPrimary type="submit">Send →</BtnPrimary>
            </div>
          </form>
        </div>
      </section>

      {/* Office card */}
      <section className="px-6 pb-16 sm:px-10 sm:pb-20 lg:px-14 lg:pb-24">
        <div className="bg-ink text-parchment p-8 sm:p-10 lg:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-gold mb-4">
              Office
            </div>
            <h2
              className="font-serif text-[28px] font-normal text-parchment m-0"
              style={{ letterSpacing: "-0.012em", lineHeight: 1.15 }}
            >
              Manila · Philippines
            </h2>
            <p
              className="text-[14.5px] mt-3 max-w-[420px] m-0"
              style={{ color: "rgba(245,239,226,0.75)", lineHeight: 1.55 }}
            >
              We work hybrid. Most of the team is in BGC; the rest are
              spread across Cebu, Iloilo, and (still) Luxembourg.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-gold mb-4">
              Hours
            </div>
            <p
              className="font-serif text-[18px] text-parchment m-0"
              style={{ lineHeight: 1.55 }}
            >
              Mon–Fri · 9:00 AM – 6:30 PM (PHT)
              <br />
              <span
                className="text-[14px]"
                style={{ color: "rgba(245,239,226,0.75)" }}
              >
                Off Saturdays except for active onboarding weeks.
              </span>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function FormField({
  label,
  placeholder,
  type = "text",
  multiline,
}: {
  label: string;
  placeholder: string;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-[6px] mb-4">
      <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={5}
          placeholder={placeholder}
          className="bg-parchment border border-line px-3 py-3 font-sans text-[14px] text-ink rounded-[2px] resize-none focus:outline-none focus:border-ink"
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className="bg-parchment border border-line px-3 py-[10px] font-sans text-[14px] text-ink rounded-[2px] focus:outline-none focus:border-ink"
        />
      )}
    </label>
  );
}
