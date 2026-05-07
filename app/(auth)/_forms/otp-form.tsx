"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/auth/auth-shell";
import { BtnPrimary } from "@/components/buttons";

type Mode = "signin" | "signup";

type Props = {
  mode: Mode;
  /** Path to redirect to after successful verification. */
  next?: string;
};

type Step = "email" | "code";

const DEFAULT_NEXT = "/library";

export function OtpForm({ mode, next: nextProp }: Props) {
  const router = useRouter();
  const next = nextProp || DEFAULT_NEXT;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function requestOtp(opts?: { silent?: boolean }) {
    setError(null);
    if (!opts?.silent) setInfo(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/otp/request", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            full_name: mode === "signup" ? fullName.trim() : undefined,
            mode,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || "Could not send code. Try again.");
          return;
        }
        setStep("code");
        if (opts?.silent) setInfo("New code sent.");
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  function verifyOtp() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim(), token: token.trim() }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json.error || "Invalid or expired code.");
          return;
        }
        // Server set cookies; refresh to pick up the new session.
        router.replace(next);
        router.refresh();
      } catch {
        setError("Network error. Try again.");
      }
    });
  }

  if (step === "email") {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          requestOtp();
        }}
      >
        {mode === "signup" && (
          <Field
            label="Your name"
            placeholder="Atty. Maria Reyes"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
            required
          />
        )}
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
        {error && <ErrorLine>{error}</ErrorLine>}
        <BtnPrimary
          type="submit"
          className="w-full mt-2 disabled:opacity-60"
          disabled={pending || !email}
        >
          {pending ? "Sending…" : "Email me a 6-digit code →"}
        </BtnPrimary>
      </form>
    );
  }

  // Step 2: code entry
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        verifyOtp();
      }}
    >
      <p className="text-[13px] text-ink-soft m-0 -mt-2 leading-[1.5]">
        We sent a 6-digit code to{" "}
        <span className="font-mono text-ink">{email}</span>. Codes expire in
        10 minutes.
      </p>
      <Field
        label="6-digit code"
        type="text"
        placeholder="123456"
        value={token}
        onChange={(v) => setToken(v.replace(/\D/g, ""))}
        inputMode="numeric"
        pattern="\d{6}"
        maxLength={6}
        autoComplete="one-time-code"
        autoFocus
        required
      />
      {error && <ErrorLine>{error}</ErrorLine>}
      {info && <InfoLine>{info}</InfoLine>}
      <BtnPrimary
        type="submit"
        className="w-full mt-2 disabled:opacity-60"
        disabled={pending || token.length !== 6}
      >
        {pending ? "Verifying…" : "Verify and continue →"}
      </BtnPrimary>
      <div className="flex items-center justify-between text-[12px] text-muted">
        <button
          type="button"
          className="text-muted hover:text-ink no-underline cursor-pointer bg-transparent border-0 p-0"
          onClick={() => {
            setStep("email");
            setToken("");
            setError(null);
            setInfo(null);
          }}
          disabled={pending}
        >
          ← Use a different email
        </button>
        <button
          type="button"
          className="text-accent no-underline cursor-pointer bg-transparent border-0 p-0"
          onClick={() => requestOtp({ silent: true })}
          disabled={pending}
        >
          Resend code
        </button>
      </div>
    </form>
  );
}

function ErrorLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45]">
      {children}
    </div>
  );
}

function InfoLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12.5px] text-success border-l-2 border-success pl-3 py-1 leading-[1.45]">
      {children}
    </div>
  );
}
