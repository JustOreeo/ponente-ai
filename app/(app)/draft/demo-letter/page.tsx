import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/app/topbar";
import { CitationPill } from "@/components/citation-pill";

export const metadata: Metadata = {
  title: "Demand to Globe Telecom — Ponente",
};

export default function DemoLetterPage() {
  return (
    <>
      <Topbar
        crumbs={[
          { label: "Library", href: "/library" },
          { label: "Demand to Globe Telecom" },
        ]}
        right={
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10.5px] text-success tracking-[0.06em]">
              ✓ 3 SOURCES
            </span>
            <button className="bg-ink text-parchment px-3 py-[6px] font-sans text-[12px] font-medium rounded-[2px] cursor-pointer">
              Export .docx ↓
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-[1.6fr_1fr] flex-1 min-h-0">
        {/* Inputs + Document */}
        <div className="flex flex-col border-r border-line overflow-auto">
          {/* Facts panel */}
          <div className="border-b border-line bg-surface px-10 py-6">
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
              Facts · 5 fields
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 max-w-[760px]">
              <FactRow label="Demanding party" value="Reyes Law Office, on behalf of GoCloud Inc." />
              <FactRow label="Recipient" value="Mr. Edgardo Tan · Globe Telecom Subscriber" />
              <FactRow label="Obligation" value="Unpaid services under SLA dated 14 Mar 2024" />
              <FactRow label="Amount" value="₱847,500.00 (eight hundred forty-seven thousand five hundred)" />
              <FactRow label="Demand period" value="15 calendar days from receipt" />
              <FactRow label="Practice area" value="Civil · obligations and contracts" />
            </div>
            <Link
              href="#"
              className="text-[12px] text-accent font-mono no-underline mt-4 inline-block tracking-[0.04em]"
            >
              Edit facts ↗
            </Link>
          </div>

          {/* Draft body */}
          <article
            className="px-12 py-10 font-serif text-[15px] text-ink leading-[1.7] flex-1"
            style={{ maxWidth: 780 }}
          >
            <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-2">
              Re: Demand for Payment
            </div>
            <p className="m-0 mb-4">
              <strong>Dear Mr. Tan,</strong>
            </p>
            <p className="m-0 mb-4">
              This is a formal demand for the immediate payment of{" "}
              <strong>₱847,500.00</strong>, representing unpaid services
              rendered by GoCloud Inc. under the Service Agreement dated 14
              March 2024 between the parties.
            </p>
            <p className="m-0 mb-4">
              Under <CitationPill>Art. 1169</CitationPill>{" "}
              <span className="italic">Civil Code of the Philippines</span>,
              your obligation became demandable upon the lapse of the agreed
              period. Continued non-payment constitutes{" "}
              <em>mora solvendi</em>, with the corresponding legal
              consequences under Articles 1170 and 1171.
            </p>
            <p className="m-0 mb-4">
              The Supreme Court has consistently affirmed that demand may be
              effected through extrajudicial means, see{" "}
              <CitationPill>G.R. No. 196444</CitationPill>{" "}
              <em>Solid Homes v. Spouses Tan</em> (2014). Further, the
              accrual of legal interest on monetary obligations is well
              settled under{" "}
              <CitationPill>G.R. No. 175852</CitationPill>{" "}
              <em>Spouses Reyes v. BPI</em> (2010).
            </p>
            <p className="m-0 mb-4">
              Failure to remit the full amount within{" "}
              <strong>fifteen (15) calendar days</strong> from receipt
              hereof shall compel us to pursue all available legal remedies,
              including the filing of a complaint for collection of sum of
              money, with damages and costs of suit.
            </p>
            <p className="m-0 mb-4">
              We trust that this matter shall be settled amicably and
              promptly.
            </p>
            <p className="m-0 mb-3">Very truly yours,</p>
            <p className="m-0 mb-1">
              <strong>Atty. Maria Reyes</strong>
            </p>
            <p className="m-0 text-[13px] text-muted">
              Reyes Law Office · Roll No. 78XXX · IBP No. 2026-XXXX
            </p>
          </article>
        </div>

        {/* Citations panel */}
        <aside className="bg-surface px-5 py-6 overflow-auto">
          <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
            Citations · 3 verified · 0 unverified
          </div>
          {[
            {
              tag: "Art. 1169",
              name: "Civil Code of the Philippines",
              meta: "Republic Act · verified",
              status: "verified",
            },
            {
              tag: "G.R. No. 196444",
              name: "Solid Homes v. Spouses Tan",
              meta: "2014 · 2nd Division · still good law",
              status: "verified",
            },
            {
              tag: "G.R. No. 175852",
              name: "Spouses Reyes v. BPI",
              meta: "2010 · En Banc · still good law",
              status: "verified",
            },
          ].map((c) => (
            <div key={c.tag} className="border-t border-line-soft py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-[5px] bg-surface-alt border border-line px-2 py-[1px] font-mono text-[10.5px] text-ink">
                  <span className="w-1 h-1 rounded-full bg-accent" />
                  {c.tag}
                </div>
                <span className="font-mono text-[10px] text-success tracking-[0.06em]">
                  ✓ verified
                </span>
              </div>
              <div className="font-serif italic text-[13px] text-ink leading-[1.4] mb-1">
                {c.name}
              </div>
              <div className="text-[10.5px] text-muted font-mono">
                {c.meta}
              </div>
              <Link
                href="#"
                className="inline-block mt-2 text-[11.5px] text-accent no-underline font-mono tracking-[0.04em]"
              >
                Open source PDF →
              </Link>
            </div>
          ))}

          <div className="mt-8 pt-6 border-t border-line">
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-2">
              Versions
            </div>
            <div className="text-[12px] text-ink-soft">
              <div className="py-[5px]">
                <span className="font-mono text-[10.5px]">v3</span> · current
                · 14:22
              </div>
              <div className="py-[5px] text-muted">
                <span className="font-mono text-[10.5px]">v2</span> · 13:48
              </div>
              <div className="py-[5px] text-muted">
                <span className="font-mono text-[10.5px]">v1</span> ·
                generated 13:30
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-1">
        {label}
      </div>
      <div className="text-[13.5px] text-ink leading-[1.4]">{value}</div>
    </div>
  );
}
