import type { ReactNode } from "react";
import Link from "next/link";

type Props = {
  eyebrow: string;
  title: ReactNode;
  sub: string;
  /** Form contents. Step-aware client form lives here. */
  children: ReactNode;
  /** Bottom link, e.g., "Don't have an account? Start free". */
  altPrompt?: string;
  altLabel?: string;
  altHref?: string;
  /** Show the "or continue with Google" divider + button. */
  showOAuth?: boolean;
};

/**
 * Visual shell for auth pages. The 2-step OTP flow (or Google OAuth) lives in
 * the children — this component just paints the card chrome.
 */
export function AuthShell({
  eyebrow,
  title,
  sub,
  children,
  altPrompt,
  altLabel,
  altHref,
  showOAuth = true,
}: Props) {
  return (
    <div className="bg-surface border border-line p-10 shadow-[0_24px_60px_#1a243814,0_1px_0_#fff_inset]">
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
        {eyebrow}
      </div>
      <h1
        className="font-serif text-[34px] font-normal m-0 mb-2"
        style={{ letterSpacing: "-0.018em", lineHeight: 1.1 }}
      >
        {title}
      </h1>
      <p className="text-[14px] text-ink-soft m-0 mb-6 leading-[1.55]">{sub}</p>

      {children}

      {showOAuth && (
        <>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[10.5px] tracking-[0.14em] uppercase text-muted font-mono">
              or
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>
          <button
            type="button"
            disabled
            className="w-full bg-parchment border border-line px-4 py-[10px] font-sans text-[13.5px] text-muted rounded-[2px] cursor-not-allowed flex items-center justify-center gap-[10px]"
            title="Google sign-in coming soon"
          >
            <GoogleGlyph />
            Continue with Google
            <span className="text-[10.5px] font-mono tracking-[0.06em] text-muted">
              soon
            </span>
          </button>
        </>
      )}

      {altPrompt && altLabel && altHref && (
        <p className="text-[12px] text-muted text-center mt-6 m-0">
          {altPrompt}{" "}
          <Link href={altHref} className="text-accent no-underline">
            {altLabel}
          </Link>
        </p>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
  autoFocus,
  inputMode,
  pattern,
  maxLength,
  autoComplete,
  name,
  disabled,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (v: string) => void;
  autoFocus?: boolean;
  inputMode?: "text" | "numeric" | "email";
  pattern?: string;
  maxLength?: number;
  autoComplete?: string;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-muted">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        autoFocus={autoFocus}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        autoComplete={autoComplete}
        disabled={disabled}
        className="bg-parchment border border-line px-3 py-[10px] font-sans text-[14px] text-ink rounded-[2px] focus:outline-none focus:border-ink disabled:opacity-60"
      />
    </label>
  );
}
