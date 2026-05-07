-- Row-level security policies.
-- Owner-scoped reads/updates. Firm-mate reads scoped to shared firm_id.

alter table public.profiles enable row level security;
alter table public.firms enable row level security;
alter table public.quota_counters enable row level security;

-- profiles -------------------------------------------------------------------

create policy "profiles: read own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles: read firm-mates"
  on public.profiles
  for select
  using (
    firm_id is not null
    and firm_id = (
      select firm_id from public.profiles where id = auth.uid()
    )
  );

create policy "profiles: update own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- firms ----------------------------------------------------------------------

create policy "firms: read own firm"
  on public.firms
  for select
  using (
    id = (
      select firm_id from public.profiles where id = auth.uid()
    )
  );

-- quota_counters -------------------------------------------------------------

create policy "quota: read own"
  on public.quota_counters
  for select
  using (auth.uid() = user_id);

create policy "quota: insert own"
  on public.quota_counters
  for insert
  with check (auth.uid() = user_id);

create policy "quota: update own"
  on public.quota_counters
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
