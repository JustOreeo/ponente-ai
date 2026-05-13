-- Phase 6 — persistence for chats and drafts.
-- Currently both are in-memory only; this gives them a real home and
-- powers /library, draft resume, and chat history.
--
-- Sharing model:
--   chats and drafts are owned by a user. If the owner is in a firm
--   AND chats.firm_id / drafts.firm_id is set, firm-mates can read them.
--   By default everything is private (firm_id null on insert).

-- ---------------------------------------------------------------------------
-- chats
-- ---------------------------------------------------------------------------
create table public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  firm_id uuid references public.firms(id) on delete set null,
  title text not null default 'New chat',
  practice_areas text[] not null default '{}',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.chats is
  'A Q&A conversation. Each chat has many chat_messages.';

create index chats_user_idx on public.chats (user_id, updated_at desc);
create index chats_firm_idx on public.chats (firm_id, updated_at desc) where firm_id is not null;

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.chat_messages is
  'One turn in a chat. Citations are an array of {tag, name, meta, status} objects.';

create index chat_messages_chat_idx on public.chat_messages (chat_id, created_at);

-- ---------------------------------------------------------------------------
-- drafts
-- ---------------------------------------------------------------------------
create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  firm_id uuid references public.firms(id) on delete set null,
  template text not null check (template in (
    'demand', 'affidavit', 'nlrc', 'mr', 'petition'
  )),
  title text not null default 'Untitled draft',
  facts jsonb not null default '{}'::jsonb,
  body text not null default '',
  citations jsonb not null default '[]'::jsonb,
  status text not null default 'drafting' check (status in (
    'drafting', 'review', 'final'
  )),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.drafts is
  'A drafted document — facts + streamed body + extracted citations.';

create index drafts_user_idx on public.drafts (user_id, updated_at desc);
create index drafts_firm_idx on public.drafts (firm_id, updated_at desc) where firm_id is not null;
create index drafts_template_idx on public.drafts (template);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger chats_set_updated_at
  before update on public.chats
  for each row execute function public.tg_set_updated_at();

create trigger drafts_set_updated_at
  before update on public.drafts
  for each row execute function public.tg_set_updated_at();

-- Bump chat.updated_at whenever a message is added so /library sorts right.
create or replace function public.tg_bump_chat_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end;
$$;

create trigger chat_messages_bump_chat
  after insert on public.chat_messages
  for each row execute function public.tg_bump_chat_on_message();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.drafts enable row level security;

-- chats: own + firm-mates (when firm_id set)
create policy "chats: read own" on public.chats
  for select using (auth.uid() = user_id);

create policy "chats: read firm-shared" on public.chats
  for select using (
    firm_id is not null
    and firm_id = (select firm_id from public.profiles where id = auth.uid())
  );

create policy "chats: insert own" on public.chats
  for insert with check (auth.uid() = user_id);

create policy "chats: update own" on public.chats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chats: delete own" on public.chats
  for delete using (auth.uid() = user_id);

-- chat_messages: derived — visible if parent chat is visible
create policy "chat_messages: read via chat" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chats c
      where c.id = chat_id
        and (
          c.user_id = auth.uid()
          or (
            c.firm_id is not null
            and c.firm_id = (select firm_id from public.profiles where id = auth.uid())
          )
        )
    )
  );

create policy "chat_messages: insert into own chat" on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.chats c where c.id = chat_id and c.user_id = auth.uid()
    )
  );

-- drafts: own + firm-mates (when firm_id set)
create policy "drafts: read own" on public.drafts
  for select using (auth.uid() = user_id);

create policy "drafts: read firm-shared" on public.drafts
  for select using (
    firm_id is not null
    and firm_id = (select firm_id from public.profiles where id = auth.uid())
  );

create policy "drafts: insert own" on public.drafts
  for insert with check (auth.uid() = user_id);

create policy "drafts: update own" on public.drafts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "drafts: delete own" on public.drafts
  for delete using (auth.uid() = user_id);
