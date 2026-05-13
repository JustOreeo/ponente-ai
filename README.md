# Ponente

Legal AI for Philippine practice. Drafts pleadings, affidavits, and position papers — and cites every case, R.A., and constitutional provision behind each line.

Built with Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase + Anthropic Claude.

## Status

| Phase | Goal                                       | Status                          |
| ----- | ------------------------------------------ | ------------------------------- |
| 0     | Visual shell                               | shipped                         |
| 1a    | Auth foundation + OTP                      | shipped — needs setup below     |
| 1b    | Q&A pipeline (Claude + Voyage + pgvector)  | code shipped — awaiting keys    |
| 1c    | SC e-Library scraper                       | code shipped — see `ingestion/` |
| 2     | Drafting MVP + .docx export                | shipped                         |
| 3     | Mobile responsive + SEO                    | shipped                         |
| 4     | Paymongo subscriptions                     | skipped for now                 |
| 5     | Tagalog button + admin issuances + teams   | shipped                         |

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

### 5. (Phase 1b) Anthropic + Voyage AI keys

For real Q&A and drafting (otherwise the stub AI client serves canned demo responses):

1. Anthropic console → **Settings → API Keys** → create a key. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```
2. Voyage AI dashboard (https://dash.voyageai.com) → API Keys → create. Add:
   ```
   VOYAGE_API_KEY=pa-...
   ```
3. Apply the Phase 1b migration via SQL Editor:
   - `20260512000005_vector.sql` — enables `pgvector`, creates `legal_documents` + `legal_chunks` + `match_legal_chunks` RPC

When Anthropic + Voyage + Supabase service-role are all set, `lib/ai/client.ts` automatically swaps the stub for the real Claude adapter. Without them, the app still runs (stub responses), so dev iteration on UI doesn't require keys.

### 6. (Phase 1b) Curate + ingest the corpus

```bash
# 1. Add chunked Markdown files under corpus/. See corpus/README.md for format.
# 2. Embed + upsert all of them via Voyage:
npm run ingest:codes
# Or one document at a time:
npm run ingest:codes -- civil_code
```

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
- **Vector store**: Supabase + pgvector (HNSW index, cosine distance)
- **Embeddings**: Voyage AI (`voyage-law-2`, 1024d, legal-domain-tuned)
- **AI**: Anthropic Claude Sonnet 4.6 (chat + drafting, with retrieval-grounded citations)
- **Hosting**: Vercel

## Phase 1b architecture

```
user query
  ↓
embedQuery (Voyage voyage-law-2, 1024d)
  ↓
match_legal_chunks RPC (Supabase pgvector, top-25 cosine)
  ↓
Claude messages.stream (Sonnet 4.6 + PH legal system prompt + retrieved chunks as context)
  ↓
SSE → browser (text + citation events)
  ↓
ChatWorkspace renders [[tag]] markers as CitationPill, side panel populated from citation events
```

`lib/ai/client.ts` is the dispatcher: real adapter when keys are set, stub otherwise. Quota enforcement (`lib/auth/quota.ts`) gates `/api/chat` and `/api/draft` — Free: 5 Q&A/day, no drafts. Pro and Small Firm: unlimited. Counters key on PH calendar day (Asia/Manila).

## Repo layout

```
ponente-ai/
├── app/                  # Next.js App Router pages + API routes
├── components/           # React components (marketing, app shell, primitives)
├── lib/                  # ai, auth, draft, supabase helpers
├── public/               # static assets
├── supabase/migrations/  # SQL migrations (apply via Supabase SQL Editor)
├── corpus/               # hand-curated PH legal markdown for ingest:codes
├── design/               # Claude Design brand reference (HTML/JSX prototypes)
├── ingestion/            # Python scraper for SC e-Library — see ingestion/README.md
└── scripts/              # one-off Node scripts (e.g. ingest-codes.ts)
```

`design/`, `corpus/`, and `ingestion/` are excluded from Vercel deploys via `.vercelignore`.

## Ingestion pipeline (Python)

The Python pipeline that scrapes SC e-Library, OCR's PDFs, and embeds them into `legal_chunks` lives at `ingestion/`. It's a separate uv project (Python 3.11) but reuses the app's `.env.local` for shared keys. See [`ingestion/README.md`](./ingestion/README.md) for setup and CLI.

```bash
cd ingestion
uv sync                                    # one-time: install Python + deps
uv run ponente-ingest pipeline --year 2025 --months Apr --limit 5   # smoke test
uv run ponente-ingest status               # see what's where
```
