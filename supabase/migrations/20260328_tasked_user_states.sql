create table if not exists public.tasked_user_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_tasked_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_tasked_user_states_updated_at on public.tasked_user_states;

create trigger set_tasked_user_states_updated_at
before update on public.tasked_user_states
for each row
execute function public.set_tasked_updated_at();

alter table public.tasked_user_states enable row level security;

drop policy if exists "tasked states select own" on public.tasked_user_states;
create policy "tasked states select own"
on public.tasked_user_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "tasked states insert own" on public.tasked_user_states;
create policy "tasked states insert own"
on public.tasked_user_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "tasked states update own" on public.tasked_user_states;
create policy "tasked states update own"
on public.tasked_user_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "tasked states delete own" on public.tasked_user_states;
create policy "tasked states delete own"
on public.tasked_user_states
for delete
to authenticated
using (auth.uid() = user_id);

