import type { Metadata } from "next";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = {
  title: "Privacy — Ponente",
  description: "How Ponente handles your data, your drafts, and your privacy.",
};

export default function PrivacyPage() {
  return (
    <Prose>
      <div className="lede">Privacy policy · last updated 2026-05-06</div>
      <h1>Privacy.</h1>
      <p className="meta">
        This is a placeholder draft. The published policy will be reviewed by
        Philippine counsel before launch.
      </p>

      <h2>What we collect.</h2>
      <p>
        Account data (name, email, firm). Drafting inputs you type into the
        product. Generated drafts and the citations that anchor them. Usage
        events (which features you use, how often). We do not collect
        device-fingerprinting data beyond what Vercel logs by default.
      </p>

      <h2>What we do with it.</h2>
      <p>
        We use your inputs to generate the outputs you ask for. We use
        aggregated, anonymized usage data to improve the product. We do not
        train any model on your drafting inputs or outputs. Anthropic, our
        AI provider, does not train on customer data per their Commercial
        Terms of Service.
      </p>

      <h2>Where it lives.</h2>
      <p>
        Account data and drafts are stored in Supabase (Postgres,
        ap-southeast-1 region). Generated .docx exports and source PDFs sit
        in Supabase Storage in the same region. Anthropic processes inputs
        in transit only — they don&apos;t persist beyond the request unless
        we explicitly cache prompts (we cache the legal-corpus prefix; we
        don&apos;t cache your facts).
      </p>

      <h2>Who can see your work.</h2>
      <p>
        Solo accounts: only you. Firm accounts: members of your firm with
        access to the shared library. Ponente staff can view drafts only
        with your written consent (e.g., a support ticket where you ask us
        to look). We log every staff access.
      </p>

      <h2>Your rights.</h2>
      <p>
        You can export all your drafts as .docx at any time. You can delete
        your account, which permanently wipes your drafts and removes
        you from any firm library (we keep firm-level shared drafts unless
        an admin deletes them). You can request a copy of all data we hold
        on you within 30 days.
      </p>

      <h2>Cookies and trackers.</h2>
      <p>
        We use a single first-party session cookie for authentication. No
        third-party advertising trackers. We use Vercel Analytics
        (anonymized, no PII).
      </p>

      <h2>Contact.</h2>
      <p>
        Questions, requests, or complaints —{" "}
        <a href="mailto:privacy@ponente.ph">privacy@ponente.ph</a>.
      </p>
    </Prose>
  );
}
