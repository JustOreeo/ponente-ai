import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = {
  title: "Terms — Ponente",
  description: "The terms of service for using Ponente.",
};

export default function TermsPage() {
  return (
    <Prose>
      <div className="lede">Terms of service · last updated 2026-05-06</div>
      <h1>Terms.</h1>
      <p className="meta">
        Placeholder draft. The published terms will be reviewed by Philippine
        counsel before launch. The clauses below are the substance, not the
        final language.
      </p>

      <h2>What Ponente is.</h2>
      <p>
        Ponente is a drafting and research aid for licensed Philippine
        lawyers and their staff. It generates pleadings, affidavits, and
        Q&amp;A answers from your inputs, grounded in a corpus of Philippine
        legal sources. It is{" "}
        <strong>not a substitute for a licensed attorney</strong> and does
        not establish any attorney-client relationship between you and the
        Ponente team.
      </p>

      <h2>Your responsibilities.</h2>
      <p>
        You verify every citation before relying on it. You do not file
        anything Ponente produces without lawyer review. You don&apos;t use
        Ponente to provide unauthorized legal services. You comply with the
        Code of Professional Responsibility and Accountability and the rules
        of the Integrated Bar of the Philippines.
      </p>

      <h2>What we promise.</h2>
      <p>
        We try to ship a useful tool. We do not warrant that any output is
        correct, complete, current, or fit for any particular use. We do
        not guarantee uptime beyond commercially reasonable best effort.
      </p>

      <h2>Acceptable use.</h2>
      <p>
        Don&apos;t use Ponente to harass, defame, or to draft documents
        intended to deceive a court. Don&apos;t scrape the product. Don&apos;t
        share your account. Don&apos;t reverse-engineer the citation
        verification.
      </p>

      <h2>Billing.</h2>
      <p>
        Pro is monthly, prepaid, no contract. Small Firm is annual,
        prepaid, with seats locked at the renewal date. Refunds within 14
        days of any annual purchase, prorated to unused months. PHP
        only. Paymongo handles cards, GCash, and Maya.
      </p>

      <h2>Termination.</h2>
      <p>
        You can cancel any time. We can terminate accounts for breach of
        these terms with notice. On termination, we export your drafts to
        you in .docx format if requested within 60 days.
      </p>

      <h2>Disputes.</h2>
      <p>
        Governed by Philippine law. Venue: Makati City. We try to resolve
        disputes informally first; arbitration is available for unresolved
        claims under PDRC rules.
      </p>

      <h2>Contact.</h2>
      <p>
        <a href="mailto:legal@ponente.ph">legal@ponente.ph</a>.
      </p>
    </Prose>
  );
}
