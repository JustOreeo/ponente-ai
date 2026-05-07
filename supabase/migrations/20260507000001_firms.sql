-- Firms — placeholder for Phase 4 multi-seat work.
-- A user without a firm is a solo practitioner; profiles.firm_id stays null.

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'small_firm')),
  created_at timestamptz not null default now()
);

comment on table public.firms is 'Law firms / organizations. Solo users have no firm.';
