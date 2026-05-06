import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/marketing/prose";

export const metadata: Metadata = {
  title: "About — Ponente",
  description:
    "Built in Manila by people who spent three years running a legal AI in Luxembourg, for the practice we know best.",
};

export default function AboutPage() {
  return (
    <Prose>
      <div className="lede">About · Manila · 2026</div>
      <h1>Built where the work happens.</h1>
      <p>
        We&apos;re a small team that spent the last three years running a
        legal AI in Luxembourg. We learned the hard part isn&apos;t answering
        — it&apos;s drafting something a lawyer would actually file. Ponente
        is what we&apos;d build if we started over, for the practice we know
        best.
      </p>

      <h2>Why Philippine practice.</h2>
      <p>
        Most legal AI ships from California. The cases are wrong, the
        citations are wrong, and the assumptions about how a lawyer&apos;s
        day works are wrong. The Philippine bar is a small, tight community
        practicing under a tradition that&apos;s its own — codal, Spanish at
        the root, English on the page, with R.A.s and Supreme Court doctrine
        layered on top. We&apos;re building a tool that knows that.
      </p>

      <h2>The wedge.</h2>
      <p>
        Q&amp;A is the easy half. Drafting — turning facts into a verified,
        properly-cited pleading — is what lawyers actually deliver to
        clients. That&apos;s the work we&apos;re here to take off your
        plate. Five templates at launch, more as we learn what you file
        most.
      </p>
      <p>
        We obsess about citations because hallucinated G.R. numbers are
        worse than no answer. Every citation Ponente produces is grounded
        in a real source — verified, dated, and clickable. The model is
        never the source of truth. The corpus is.
      </p>

      <h2>Why &quot;Ponente.&quot;</h2>
      <p>
        <em>Po·nén·te,</em> n. — the justice who writes the decision. Every
        Philippine lawyer knows the term; non-lawyers don&apos;t. The
        asymmetry is the brand: a tool built by people who&apos;ve read the
        citations, for people who write them.
      </p>

      <h2>Where we&apos;re heading.</h2>
      <p>
        Phase 1 is auth and Q&amp;A with verified citations. Phase 2 is the
        five drafting templates with .docx export. Phase 3 deepens the
        corpus and adds source-PDF viewing. Phase 4 brings firm accounts,
        seats, and SSO. We ship every week.
      </p>

      <hr />

      <p className="meta" id="changelog">
        Want to know what&apos;s new? We post weekly updates in the{" "}
        <Link href="/contact">contact channel</Link> until the public
        changelog ships. Or sign up for the launch list — we&apos;ll email
        when each phase goes live.
      </p>
    </Prose>
  );
}
