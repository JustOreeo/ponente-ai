"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Firm = {
  id: string;
  name: string;
  plan: "free" | "pro" | "small_firm";
};

export function FirmSettingsForm({ firm }: { firm: Firm }) {
  const router = useRouter();
  const [name, setName] = useState(firm.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = name.trim() !== firm.name;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || pending) return;
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/firm", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-surface border border-line p-6 sm:p-8">
      <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-4">
        Firm details
      </div>
      <label className="block">
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-1.5 block">
          Name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          maxLength={120}
          className="w-full bg-parchment border border-line px-3 py-[10px] font-sans text-[14.5px] text-ink rounded-[2px] focus:outline-none focus:border-ink"
        />
      </label>

      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] text-ink-soft border-t border-line-soft pt-5">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted mb-1">
            Plan
          </div>
          <div>
            {firm.plan === "small_firm"
              ? "Small Firm"
              : firm.plan === "pro"
                ? "Pro"
                : "Free"}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted mb-1">
            Firm ID
          </div>
          <div className="font-mono text-[11.5px] text-muted truncate">
            {firm.id}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45]">
          {error}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-[12px] text-muted">
          {saved ? "Saved." : dirty ? "Unsaved changes." : "Up to date."}
        </span>
        <button
          type="submit"
          disabled={!dirty || pending}
          className="bg-ink text-parchment border-0 px-4 py-[8px] font-sans text-[13px] font-medium rounded-[2px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
