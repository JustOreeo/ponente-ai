import type { Metadata } from "next";
import { AuthCard } from "@/components/marketing/auth-card";

export const metadata: Metadata = {
  title: "Sign in — Ponente",
};

export default function SignInPage() {
  return (
    <AuthCard
      eyebrow="Welcome back"
      title={
        <>
          Sign in to{" "}
          <em className="italic text-accent">Ponente.</em>
        </>
      }
      sub="We'll email you a magic link. No password to remember."
      primaryLabel="Send magic link →"
      altPrompt="Don't have an account?"
      altLabel="Start free"
      altHref="/sign-up"
    />
  );
}
