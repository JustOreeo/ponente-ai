import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "../_forms/otp-form";

export const metadata: Metadata = {
  title: "Create account — Ponente",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell
      eyebrow="Start free"
      title={
        <>
          Create your <em className="italic text-accent">Ponente</em> account.
        </>
      }
      sub="Five free questions per day. No card required. Upgrade when you start drafting."
      altPrompt="Already have an account?"
      altLabel="Sign in"
      altHref="/sign-in"
    >
      <OtpForm mode="signup" next={next} />
    </AuthShell>
  );
}
