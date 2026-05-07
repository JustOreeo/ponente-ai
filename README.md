# Ponente

Legal AI for Philippine practice. Drafts pleadings, affidavits, and position papers — and cites every case, R.A., and constitutional provision behind each line.

Built with Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase + Anthropic Claude.

## Status

| Phase | Goal                            | Status                          |
| ----- | ------------------------------- | ------------------------------- |
| 0     | Visual shell                    | shipped                         |
| 1a    | Auth foundation + OTP           | shipped — needs setup below     |
| 1b    | Q&A + sources + quota           | next                            |
| 2     | Drafting MVP + .docx export     | —                               |
| 3     | Citation depth + source PDFs    | —                               |
| 4     | Paymongo + firm SSO             | —                               |
| 5     | Mobile + ops hardening          | —                               |

## Local development

```bash
npm install
cp .env.local.example .env.local   # then fill in real values — see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run lint` to lint, `npm run build` to verify a production build.

## One-time setup (off-band)

To run anything past the homepage, you need a Supabase project and a Resend account. Follow these steps once:

### 1. Supabase project

1. Create a project at <https://supabase.com>. Region: **Singapore (ap-southeast-1)**.
2. Save these from **Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` — the project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` public key
   - `SUPABASE_SERVICE_ROLE_KEY` — the `service_role` secret (server-only)
3. Apply migrations. Easiest: open **SQL Editor** in the Supabase dashboard and paste each file under `supabase/migrations/` in numerical order:
   - `20260507000001_firms.sql`
   - `20260507000002_profiles.sql`
   - `20260507000003_quota.sql`
   - `20260507000004_rls.sql`
4. (Optional, when schema changes:) regenerate TypeScript types
   ```bash
   npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/types.ts
   ```

### 2. Resend (sender for OTP emails)

1. Create an account at <https://resend.com>.
2. Add and verify your sending domain (DNS: SPF + DKIM). Use `auth@yourdomain` or similar.
3. Create an API key.

### 3. Wire Resend into Supabase Auth

In the Supabase dashboard:

1. **Authentication → Providers → Email** — leave email auth enabled.
2. **Authentication → Email Templates** — open the **Magic Link** template (Supabase reuses it for both magic-link and OTP code emails). Replace the body with something like:
   ```html
   <h2>Your Ponente sign-in code</h2>
   <p>Use this code to finish signing in:</p>
   <p style="font-size: 24px; letter-spacing: 0.2em; font-family: monospace">{{ .Token }}</p>
   <p>The code expires in 10 minutes. Ignore this email if you didn't request it.</p>
   ```
   The `{{ .Token }}` placeholder renders the 6-digit code.
3. **Authentication → SMTP Settings** — enable custom SMTP and fill in:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
   - Sender email: `auth@yourdomain` (must match a verified Resend domain)
   - Sender name: `Ponente`
4. **Authentication → Email Settings** — set **Confirm email** to **Off**. We use OTP for verification, not double-confirm.

### 4. Fill `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart the dev server after editing `.env.local`.

## Routes

```
Marketing (public, static)        Auth (public, dynamic)       App (gated, dynamic)
─────────────────────────────     ────────────────────────     ────────────────────
/                                 /sign-in                      /library
/pricing                          /sign-up                      /chat
/drafting                                                       /draft/new
/qa                               API                           /draft/demo-letter
/citations                        ────────────────────────
/for-firms                        POST /api/auth/otp/request    Internals
/about                            POST /api/auth/otp/verify     ────────────────────
/privacy                          POST /api/auth/signout        proxy.ts (auth gate)
/terms
/contact
```

`/library`, `/chat`, `/draft/*` require a session — `proxy.ts` redirects to `/sign-in?next=<path>` otherwise.

## Stack

- **Web**: Next.js 16 (App Router, RSC, Turbopack)
- **Styling**: Tailwind v4 with design tokens (Library palette: parchment, court navy, oxblood)
- **Fonts**: Source Serif 4 (display), Inter (UI), IBM Plex Mono (accents) — via `next/font/google`
- **Auth**: Supabase Auth, 6-digit OTP via Resend SMTP, no magic links
- **DB**: Supabase Postgres with RLS
- **AI**: Anthropic Claude (Phase 1b+)
- **Hosting**: Vercel
