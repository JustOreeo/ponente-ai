-- Profiles — 1:1 with auth.users. Auto-populated by trigger on signup.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  firm_id uuid references public.firms(id) on delete set null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'User profiles. Created automatically when an auth.users row appears.';

-- Trigger function: when a new auth.users row is created, insert a matching
-- profile row using the full_name from raw_user_meta_data (set during signInWithOtp).
-- Falls back to the local-part of the email address if no name was supplied.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
