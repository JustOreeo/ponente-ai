"use client";

import { useMemo, useState } from "react";
import { renderWithCitations } from "@/components/citation-rendered";
import { readEvents } from "@/lib/ai/stream";
import { PaywallModal } from "@/components/ui/paywall-modal";
import type { Citation } from "@/lib/ai/events";
import {
  initialFacts,
  missingRequired,
  type Template,
} from "@/lib/draft/templates";

/**
 * Generic drafting workspace. Renders the template's form on the left and
 * a streamed draft preview + citations panel on the right. Generates via
 * /api/draft and exports via /api/draft/export.
 */
export function DraftWorkspace({ template }: { template: Template }) {
  const [facts, setFacts] = useState<Record<string, string>>(() =>
    initialFacts(template),
  );
  const [body, setBody] = useState("");
  const [citations, setCitations] = useState<Citation[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<
    | { open: false }
    | {
        open: true;
        type: "qa" | "draft";
        used?: number;
        limit?: number | "unlimited";
      }
  >({ open: false });

  const verifiedCount = citations.filter((c) => c.status === "verified").length;
  const unverifiedCount = citations.length - verifiedCount;

  const missing = useMemo(
    () => missingRequired(template, facts),
    [template, facts],
  );

  function setField(key: string, value: string) {
    setFacts((prev) => ({ ...prev, [key]: value }));
  }

  async function generate() {
    if (streaming || missing.length > 0) return;
    setStreaming(true);
    setError(null);
    setBody("");
    setCitations([]);

    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template: template.apiKey, facts }),
      });
      if (res.status === 429) {
        const json = await res.json().catch(() => ({}));
        setPaywall({
          open: true,
          type: "draft",
          used: json.used,
          limit: json.limit,
        });
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      for await (const event of readEvents(res)) {
        if (event.type === "text") {
          setBody((prev) => prev + event.delta);
        } else if (event.type === "citation") {
          const c = event.citation;
          setCitations((prev) =>
            prev.some((p) => p.tag === c.tag) ? prev : [...prev, c],
          );
        } else if (event.type === "error") {
          throw new Error(event.message);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stream error.");
    } finally {
      setStreaming(false);
    }
  }

  async function exportDocx() {
    if (exporting || !body.trim()) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/draft/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: template.name,
          template: template.apiKey,
          body,
        }),
      });
      if (!res.ok) {
        throw new Error(`Export failed: HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.slug}-draft.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-[1fr_1fr] flex-1 min-h-0">
        {/* LEFT — facts form */}
        <div className="flex flex-col border-r border-line overflow-auto">
          <div className="flex items-center justify-between px-8 py-4 border-b border-line bg-parchment sticky top-0 z-[1]">
            <div>
              <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted">
                {template.code} · facts
              </div>
              <div className="text-[12px] text-ink-soft mt-1">
                {template.fields.length} fields
                {missing.length > 0 && (
                  <span className="text-accent">
                    {" "}
                    · {missing.length} required
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={generate}
              disabled={streaming || missing.length > 0}
              className="bg-ink text-parchment border-0 px-4 py-[8px] font-sans text-[13px] font-medium rounded-[2px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                missing.length > 0
                  ? "Fill in the required fields first."
                  : undefined
              }
            >
              {streaming ? "Streaming…" : body ? "Regenerate ↻" : "Generate →"}
            </button>
          </div>

          <div className="px-8 py-6 flex flex-col gap-5">
            {template.fields.map((field) => {
              const value = facts[field.key] ?? "";
              const isMissing = field.required && !value.trim();
              return (
                <div key={field.key}>
                  <label
                    className="block font-mono text-[10.5px] tracking-[0.14em] uppercase text-muted mb-1.5"
                    htmlFor={`field-${field.key}`}
                  >
                    {field.label}
                    {field.required && (
                      <span aria-hidden className="text-accent ml-1">
                        *
                      </span>
                    )}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={`field-${field.key}`}
                      value={value}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows ?? 3}
                      className={`w-full bg-surface border ${isMissing ? "border-accent/40" : "border-line"} px-3 py-2 font-sans text-[13.5px] text-ink leading-[1.55] resize-y focus:border-ink focus:outline-none rounded-[2px]`}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={`field-${field.key}`}
                      value={value}
                      onChange={(e) => setField(field.key, e.target.value)}
                      className={`w-full bg-surface border ${isMissing ? "border-accent/40" : "border-line"} px-3 py-2 font-sans text-[13.5px] text-ink focus:border-ink focus:outline-none rounded-[2px]`}
                    >
                      <option value="">Select…</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`field-${field.key}`}
                      type="text"
                      value={value}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full bg-surface border ${isMissing ? "border-accent/40" : "border-line"} px-3 py-2 font-sans text-[13.5px] text-ink focus:border-ink focus:outline-none rounded-[2px]`}
                    />
                  )}
                  {field.helper && (
                    <p className="text-[11.5px] text-muted mt-1.5 m-0 leading-[1.4]">
                      {field.helper}
                    </p>
                  )}
                </div>
              );
            })}

            {error && (
              <div className="text-[12.5px] text-accent border-l-2 border-accent pl-3 py-1 leading-[1.45]">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — preview + citations */}
        <div className="flex flex-col overflow-hidden min-h-0">
          <div className="flex items-center justify-between px-7 py-4 border-b border-line bg-parchment">
            <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted">
              Preview · {body ? "live" : "empty"}
            </div>
            <div className="flex items-center gap-3">
              {citations.length > 0 && (
                <span className="font-mono text-[10.5px] text-muted">
                  {verifiedCount} verified
                  {unverifiedCount > 0 && (
                    <span className="text-accent"> · {unverifiedCount} unverified</span>
                  )}
                </span>
              )}
              <button
                type="button"
                onClick={exportDocx}
                disabled={exporting || !body.trim()}
                className="bg-transparent border border-ink text-ink px-3 py-[6px] font-sans text-[12px] font-medium rounded-[2px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink hover:text-parchment transition-colors"
              >
                {exporting ? "Exporting…" : "Export .docx ↓"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_240px] flex-1 min-h-0">
            {/* Body */}
            <article className="px-8 py-7 font-serif text-[14.5px] text-ink leading-[1.7] overflow-auto border-r border-line">
              {body ? (
                renderWithCitations(
                  body,
                  new Map(citations.map((c) => [c.tag, c])),
                )
              ) : (
                <p className="text-muted italic m-0">
                  Fill in the facts and click{" "}
                  <strong className="text-ink not-italic">Generate</strong> to
                  stream a draft.
                </p>
              )}
            </article>

            {/* Citations panel */}
            <aside className="bg-surface px-4 py-5 overflow-auto">
              <div className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">
                Citations
              </div>
              {citations.length === 0 ? (
                <p className="text-[11.5px] text-muted italic m-0">
                  Citations appear as the draft streams.
                </p>
              ) : (
                citations.map((c) => {
                  const isUnverified = c.status === "unverified";
                  return (
                    <div
                      key={c.tag}
                      className="border-t border-line-soft py-3 first:border-t-0"
                    >
                      <div
                        className={`inline-flex items-center gap-[5px] bg-surface-alt border ${isUnverified ? "border-dashed border-muted" : "border-line"} px-2 py-[1px] font-mono text-[10.5px] text-ink mb-[6px]`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${isUnverified ? "bg-muted" : "bg-accent"}`}
                        />
                        {c.tag}
                      </div>
                      <div className="font-serif italic text-[12.5px] text-ink leading-[1.4]">
                        {c.name}
                      </div>
                      <div
                        className={`text-[10.5px] font-mono mt-[2px] ${isUnverified ? "text-accent" : "text-muted"}`}
                      >
                        {c.meta}
                      </div>
                    </div>
                  );
                })
              )}
            </aside>
          </div>
        </div>
      </div>

      <PaywallModal
        open={paywall.open}
        onClose={() => setPaywall({ open: false })}
        type={paywall.open ? paywall.type : "draft"}
        used={paywall.open ? paywall.used : undefined}
        limit={paywall.open ? paywall.limit : undefined}
      />
    </>
  );
}
