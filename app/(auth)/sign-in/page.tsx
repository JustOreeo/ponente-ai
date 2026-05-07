import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "../_forms/otp-form";

export const metadata: Metadata = {
  title: "Sign in — Ponente",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Sign in to <em className="italic text-accent">Ponente.</em>
        </>
      }
      sub="Enter your email and we'll send you a 6-digit code. No password to remember."
      altPrompt="Don't have an account?"
      altLabel="Start free"
      altHref="/sign-up"
    >
      <OtpForm mode="signin" next={next} />
    </AuthShell>
  );
}
