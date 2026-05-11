"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateFirmForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/firm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create firm.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-surface border border-line p-6 sm:p-8">
      <label className="block">
        <span className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-1.5 block">
          Firm name
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cruz & Partners"
          maxLength={120}
          autoFocus
          className="w-full bg-parchment border border-line px-3 py-[10px] font-sans text-[14.5px] text-ink rounded-[2px] focus:outline-none focus:border-ink"
        />
      </label>
      {error && (
        <div className="mt-3 text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45]">
          {error}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between">
        <span className="text-[12px] text-muted">
          You'll be the first admin. Invite teammates next.
        </span>
        <button
          type="submit"
          disabled={!name.trim() || pending}
          className="bg-ink text-parchment border-0 px-4 py-[8px] font-sans text-[13px] font-medium rounded-[2px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Creating…" : "Create firm →"}
        </button>
      </div>
    </form>
  );
}
