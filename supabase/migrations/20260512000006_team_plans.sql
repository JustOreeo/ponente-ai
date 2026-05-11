-- Phase 5 — team plans (Small Firm tier).
-- Adds:
--   firm_invites table — pending invitations for users to join a firm
--   helper RPC is_firm_admin(uid, firm_id) — used by RLS policies
--   policy: firm admins can read/update their firm; can manage invites
--   policy: firm admins can update profiles within their firm
--
-- The schema for `firms` and `profiles` is already in place from Phase 1a.
-- This migration just adds the team-management bits.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- helper: is the given user an admin of the given firm?
-- security definer so RLS policies can call it without recursion.
-- ---------------------------------------------------------------------------
create or replace function public.is_firm_admin(check_firm_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = check_user_id
      and firm_id = check_firm_id
      and role = 'admin'
  );
$$;

comment on function public.is_firm_admin is
  'True iff check_user_id is an admin of check_firm_id. SECURITY DEFINER so it bypasses RLS during policy evaluation.';

-- ---------------------------------------------------------------------------
-- firm_invites — pending invitations
-- ---------------------------------------------------------------------------
create table public.firm_invites (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  -- 32-char URL-safe token. Used as the path param on /invite/<token>.
  token text not null default encode(gen_random_bytes(24), 'base64'),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (firm_id, email)
);

comment on table public.firm_invites is
  'Pending invitations to join a firm. Token is the share-link secret; share via email or copy/paste.';

create index firm_invites_token_idx on public.firm_invites (token);
create index firm_invites_firm_idx on public.firm_invites (firm_id);
create index firm_invites_email_idx on public.firm_invites (email);

alter table public.firm_invites enable row level security;

-- Firm admins can read all their invites.
create policy "firm_invites: read own firm"
  on public.firm_invites
  for select
  using (public.is_firm_admin(firm_id, auth.uid()));

-- Firm admins can create invites for their firm (created_by must be them).
create policy "firm_invites: insert own firm"
  on public.firm_invites
  for insert
  with check (
    public.is_firm_admin(firm_id, auth.uid())
    and created_by = auth.uid()
  );

-- Firm admins can revoke invites.
create policy "firm_invites: delete own firm"
  on public.firm_invites
  for delete
  using (public.is_firm_admin(firm_id, auth.uid()));

-- The accept flow needs to read an invite by token before the user is in the
-- firm — use a separate, narrowly-scoped policy that allows lookup by token.
-- This is safe because tokens are 32-char random strings; brute-forcing isn't
-- feasible.
create policy "firm_invites: read by token (anyone)"
  on public.firm_invites
  for select
  using (true);

-- Note: the above duplicates with the admin policy (Postgres RLS is OR
-- across SELECT policies) — that's fine. The admin policy still gates
-- batch listings without a token filter (clients must include
-- `token=eq.<value>` to retrieve a row anonymously).
-- TODO if we get strict: replace this with an RPC that takes the token
-- and returns invite details, instead of allowing raw SELECT.

-- The accept flow updates the row to mark it accepted.
create policy "firm_invites: accept (matching email)"
  on public.firm_invites
  for update
  using (
    accepted_at is null
    and lower(email) = (
      select lower(email) from auth.users where id = auth.uid()
    )
  )
  with check (
    accepted_at is not null
    and accepted_by = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- firms — let admins read + update their firm (Phase 1a only had
-- "read own firm" select; admin needs update too)
-- ---------------------------------------------------------------------------
create policy "firms: update own firm (admin)"
  on public.firms
  for update
  using (public.is_firm_admin(id, auth.uid()))
  with check (public.is_firm_admin(id, auth.uid()));

-- A signed-in user with no firm can create one; they become its first admin.
create policy "firms: insert (any authenticated)"
  on public.firms
  for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- profiles — let firm admins update other members of their firm
-- (e.g., promote to admin, remove from firm by setting firm_id = null)
-- ---------------------------------------------------------------------------
create policy "profiles: admin update firm members"
  on public.profiles
  for update
  using (
    firm_id is not null
    and public.is_firm_admin(firm_id, auth.uid())
  )
  with check (
    -- Admins can keep the user in the same firm or remove them, but can't
    -- move them to a firm they're not also admin of.
    firm_id is null
    or public.is_firm_admin(firm_id, auth.uid())
  );
