import "server-only";

/**
 * Plain HTML email templates. Inline styles only — most email clients ignore
 * <style> blocks. Tested in Gmail, iCloud Mail, Outlook web.
 *
 * Brand styling matches the Library palette: parchment background, court
 * navy text, oxblood accent.
 */

const BRAND_NAVY = "#1a2438";
const BRAND_OXBLOOD = "#8b2a1f";
const BRAND_MUTED = "#6b6357";
const BRAND_PARCHMENT = "#f5efe2";
const BRAND_LINE = "#d9cfb8";

function shell(opts: {
  preheader?: string;
  body: string;
}): string {
  const preheader = opts.preheader ?? "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ponente</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_PARCHMENT};color:${BRAND_NAVY};font-family:Georgia, serif;">
  <span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_PARCHMENT};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#faf7ee;border:1px solid ${BRAND_LINE};border-radius:2px;">
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <div style="font-family:'IBM Plex Mono',Menlo,monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND_MUTED};">
                Ponente
              </div>
            </td>
          </tr>
          <tr><td style="padding:0 32px 32px 32px;">${opts.body}</td></tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid ${BRAND_LINE};">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND_MUTED};font-style:italic;line-height:1.55;">
                Ponente is a legal drafting and research aid built for Philippine practice.
                It is not a substitute for a licensed attorney.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND_MUTED};">
          Manila &middot; Philippines
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>
    <td style="background:${BRAND_NAVY};border-radius:2px;">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${BRAND_PARCHMENT};text-decoration:none;letter-spacing:0.005em;">
        ${label}
      </a>
    </td>
  </tr></table>`;
}

// ---------------------------------------------------------------------------
// Invite email
// ---------------------------------------------------------------------------

export type InviteEmailParams = {
  firmName: string;
  inviterName: string | null;
  recipientEmail: string;
  acceptUrl: string;
  expiresAt: string; // ISO
  role: "admin" | "member";
};

export function renderInviteEmail(p: InviteEmailParams): {
  subject: string;
  html: string;
} {
  const inviter = p.inviterName?.trim() ? p.inviterName.trim() : "A teammate";
  const expires = new Date(p.expiresAt).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const subject = `${inviter} invited you to ${p.firmName} on Ponente`;
  const html = shell({
    preheader: `Join ${p.firmName} on Ponente. Invite expires ${expires}.`,
    body: `
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;letter-spacing:-0.018em;line-height:1.1;color:${BRAND_NAVY};margin:8px 0 12px;">
        Join <em style="font-style:italic;color:${BRAND_OXBLOOD};">${escapeHtml(p.firmName)}</em> on Ponente.
      </h1>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14.5px;color:${BRAND_NAVY};line-height:1.55;margin:0 0 16px;">
        ${escapeHtml(inviter)} invited <strong>${escapeHtml(p.recipientEmail)}</strong> to join their firm as
        <strong>${p.role === "admin" ? "an admin" : "a member"}</strong>.
        Your individual drafts stay yours; the firm's shared library becomes accessible after you accept.
      </p>
      ${button("Accept invite →", p.acceptUrl)}
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;color:${BRAND_MUTED};line-height:1.55;margin:0 0 8px;">
        Or paste this link into your browser:
      </p>
      <p style="font-family:'IBM Plex Mono',Menlo,monospace;font-size:11.5px;color:${BRAND_NAVY};word-break:break-all;margin:0 0 16px;">
        ${escapeHtml(p.acceptUrl)}
      </p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;color:${BRAND_MUTED};line-height:1.55;margin:0;">
        This invite expires <strong>${expires}</strong>. If it wasn't meant for you, ignore this email.
      </p>
    `,
  });
  return { subject, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
