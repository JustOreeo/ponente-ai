-- Quota counters — shipped now, used by Phase 1b for daily Q&A limit (5/day on Free).

create table public.quota_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  qa_count int not null default 0,
  draft_count int not null default 0,
  primary key (user_id, day)
);

comment on table public.quota_counters is 'Per-user daily counters for Q&A and drafting requests.';
