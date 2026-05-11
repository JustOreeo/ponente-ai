"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  token: string;
  firmName: string;
  email: string;
  role: "admin" | "member";
  expiresAt: string;
  currentEmail: string | null;
};

export function AcceptInviteClient({
  token,
  firmName,
  email,
  role,
  expiresAt,
  currentEmail,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matchesSignedIn =
    currentEmail && currentEmail.toLowerCase() === email.toLowerCase();

  async function accept() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}`, { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      router.push("/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
        Firm invite
      </div>
      <h1
        className="font-serif text-[26px] sm:text-[28px] font-normal m-0 mb-3"
        style={{ letterSpacing: "-0.018em", lineHeight: 1.15 }}
      >
        Join <em className="italic text-accent">{firmName}</em> on Ponente.
      </h1>
      <p className="text-[14.5px] text-ink-soft m-0 mb-6 leading-[1.55]">
        You'll join as a{" "}
        <strong className="text-ink">
          {role === "admin" ? "firm admin" : "member"}
        </strong>
        . Your individual drafts stay yours; the firm's shared library becomes
        accessible.
      </p>

      <div className="bg-parchment border border-line px-4 py-3 mb-5 text-[13px]">
        <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-1">
          Invited address
        </div>
        <div className="text-ink">{email}</div>
      </div>

      {!currentEmail ? (
        <>
          <p className="text-[13.5px] text-muted m-0 mb-5">
            You need to sign in (or sign up) using <strong>{email}</strong>{" "}
            first.
          </p>
          <div className="flex gap-3">
            <Link
              href={`/sign-in?next=/invite/${encodeURIComponent(token)}`}
              className="bg-ink text-parchment px-4 py-[10px] font-sans text-[13px] font-medium rounded-[2px] no-underline"
            >
              Sign in →
            </Link>
            <Link
              href={`/sign-up?next=/invite/${encodeURIComponent(token)}`}
              className="bg-transparent border border-ink text-ink px-4 py-[10px] font-sans text-[13px] font-medium rounded-[2px] no-underline"
            >
              Create account
            </Link>
          </div>
        </>
      ) : !matchesSignedIn ? (
        <>
          <div className="text-[13.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.55] mb-4">
            You're signed in as <strong>{currentEmail}</strong>, but this
            invite is for <strong>{email}</strong>. Sign out and sign in with
            the invited address.
          </div>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="bg-ink text-parchment px-4 py-[10px] font-sans text-[13px] font-medium rounded-[2px] cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={accept}
            disabled={pending}
            className="bg-ink text-parchment border-0 px-5 py-[10px] font-sans text-[13.5px] font-medium rounded-[2px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? "Joining…" : `Accept and join ${firmName} →`}
          </button>
          {error && (
            <div className="mt-3 text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45]">
              {error}
            </div>
          )}
        </>
      )}

      <div className="mt-6 pt-5 border-t border-line-soft text-[11.5px] text-muted">
        Invite expires{" "}
        {new Date(expiresAt).toLocaleDateString("en-PH", {
          timeZone: "Asia/Manila",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
        .
      </div>
    </>
  );
}
