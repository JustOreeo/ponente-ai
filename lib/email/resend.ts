import "server-only";
import { captureException } from "@/lib/sentry";

/**
 * Tiny Resend client. POST against the HTTP API; no SDK dep.
 * No-op when RESEND_API_KEY is empty so the rest of the app keeps working
 * for users who haven't wired Resend in yet.
 *
 * https://resend.com/docs/api-reference/emails/send-email
 */

const API_URL = "https://api.resend.com/emails";

export type SendResult =
  | { sent: true; id: string }
  | { sent: false; reason: string };

export type SendOptions = {
  to: string | string[];
  subject: string;
  /** Plain HTML. Use renderInviteEmail / renderWelcomeEmail to build. */
  html: string;
  /** Optional plain-text alternative; falls back to a stripped HTML version. */
  text?: string;
  /** Override the default sender (configured via RESEND_FROM_ADDRESS). */
  from?: string;
  /** Reply-To address. */
  replyTo?: string;
  /** Tags for Resend's UI / webhooks. */
  tags?: { name: string; value: string }[];
};

export async function sendEmail(opts: SendOptions): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.RESEND_FROM_ADDRESS;
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not set" };
  }
  const from = opts.from ?? defaultFrom;
  if (!from) {
    return { sent: false, reason: "RESEND_FROM_ADDRESS not set and no `from` override" };
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text ?? stripHtml(opts.html),
        reply_to: opts.replyTo,
        tags: opts.tags,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const reason = `Resend ${res.status}: ${body.slice(0, 200)}`;
      captureException(new Error(reason), {
        tags: { service: "resend" },
        extras: { subject: opts.subject, to: opts.to },
      });
      return { sent: false, reason };
    }
    const json = (await res.json()) as { id?: string };
    return { sent: true, id: json.id ?? "" };
  } catch (err) {
    captureException(err, { tags: { service: "resend" } });
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "unknown",
    };
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
