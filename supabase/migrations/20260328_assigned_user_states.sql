create table if not exists public.assigned_user_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_assigned_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_assigned_user_states_updated_at on public.assigned_user_states;

create trigger set_assigned_user_states_updated_at
before update on public.assigned_user_states
for each row
execute function public.set_assigned_updated_at();

alter table public.assigned_user_states enable row level security;

grant usage on schema public to authenticated;
grant usage on schema public to service_role;

grant select, insert, update, delete on table public.assigned_user_states to authenticated;
grant select, insert, update, delete on table public.assigned_user_states to service_role;

drop policy if exists "assigned states select own" on public.assigned_user_states;
create policy "assigned states select own"
on public.assigned_user_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "assigned states insert own" on public.assigned_user_states;
create policy "assigned states insert own"
on public.assigned_user_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "assigned states update own" on public.assigned_user_states;
create policy "assigned states update own"
on public.assigned_user_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "assigned states delete own" on public.assigned_user_states;
create policy "assigned states delete own"
on public.assigned_user_states
for delete
to authenticated
using (auth.uid() = user_id);
