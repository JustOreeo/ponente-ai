"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field } from "@/components/auth/auth-shell";
import { BtnPrimary } from "@/components/buttons";

type Props = {
  /** Path to redirect to after successful sign-in. */
  next?: string;
};

const DEFAULT_NEXT = "/library";

export function PasswordForm({ next: nextProp }: Props) {
  const router = useRouter();
  const next = nextProp || DEFAULT_NEXT;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/password", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || "Invalid email or password.");
          return;
        }
        router.replace(next);
        router.refresh();
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  const otpHref = next
    ? `/sign-in?next=${encodeURIComponent(next)}`
    : "/sign-in";

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Field
        label="Email"
        type="email"
        placeholder="you@firm.com"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        inputMode="email"
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
      />
      {error && (
        <div className="text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45]">
          {error}
        </div>
      )}
      <BtnPrimary
        type="submit"
        className="w-full mt-2 disabled:opacity-60"
        disabled={pending || !email || !password}
      >
        {pending ? "Signing in…" : "Sign in →"}
      </BtnPrimary>
      <p className="text-[12px] text-muted text-center m-0">
        <Link href={otpHref} className="text-accent no-underline">
          Email me a code instead
        </Link>
      </p>
    </form>
  );
}
