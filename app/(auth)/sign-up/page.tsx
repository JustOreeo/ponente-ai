import type { Metadata } from "next";
import { AuthCard, Field } from "@/components/marketing/auth-card";

export const metadata: Metadata = {
  title: "Create account — Ponente",
};

export default function SignUpPage() {
  return (
    <AuthCard
      eyebrow="Start free"
      title={
        <>
          Create your{" "}
          <em className="italic text-accent">Ponente</em> account.
        </>
      }
      sub="Five free questions per day. No card required. Upgrade when you start drafting."
      primaryLabel="Send magic link →"
      altPrompt="Already have an account?"
      altLabel="Sign in"
      altHref="/sign-in"
      extra={
        <Field label="Your name" placeholder="Atty. Maria Reyes" required />
      }
    />
  );
}
