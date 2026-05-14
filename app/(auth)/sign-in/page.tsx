import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "../_forms/otp-form";
import { PasswordForm } from "../_forms/password-form";

export const metadata: Metadata = {
  title: "Sign in — Ponente",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; method?: string }>;
}) {
  const { next, method } = await searchParams;
  const usePassword = method === "password";

  const passwordHref = next
    ? `/sign-in?method=password&next=${encodeURIComponent(next)}`
    : "/sign-in?method=password";

  return (
    <AuthShell
      eyebrow="Welcome back"
      title={
        <>
          Sign in to <em className="italic text-accent">Ponente.</em>
        </>
      }
      sub={
        usePassword
          ? "Enter your email and password."
          : "Enter your email and we'll send you a 6-digit code. No password to remember."
      }
      altPrompt="Don't have an account?"
      altLabel="Start free"
      altHref="/sign-up"
    >
      {usePassword ? (
        <PasswordForm next={next} />
      ) : (
        <>
          <OtpForm mode="signin" next={next} />
          <p className="text-[12px] text-muted text-center mt-4 m-0">
            <Link href={passwordHref} className="text-accent no-underline">
              Sign in with password
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
