create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'assigned_role') then
    create type public.assigned_role as enum ('field', 'office', 'manager');
  end if;
end
$$;

create table if not exists public.assigned_organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.assigned_organizations (slug, name)
values ('samaya', 'Samaya')
on conflict (slug) do update set name = excluded.name;

create table if not exists public.assigned_user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  display_name text not null default '',
  avatar_url text,
  timezone text not null default 'America/Phoenix',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assigned_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.assigned_organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.assigned_role not null default 'field',
  is_admin boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, user_id),
  unique (user_id)
);

create table if not exists public.assigned_role_permissions (
  role public.assigned_role not null,
  permission text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role, permission)
);

insert into public.assigned_role_permissions (role, permission)
values
  ('field', 'view_workspace'),
  ('field', 'view_own_tasks'),
  ('field', 'update_own_tasks'),
  ('field', 'complete_own_tasks'),
  ('office', 'view_workspace'),
  ('office', 'view_own_tasks'),
  ('office', 'update_own_tasks'),
  ('office', 'complete_own_tasks'),
  ('office', 'view_team_tasks'),
  ('office', 'create_tasks'),
  ('office', 'assign_tasks'),
  ('manager', 'view_workspace'),
  ('manager', 'view_own_tasks'),
  ('manager', 'update_own_tasks'),
  ('manager', 'complete_own_tasks'),
  ('manager', 'view_team_tasks'),
  ('manager', 'create_tasks'),
  ('manager', 'assign_tasks'),
  ('manager', 'manage_users'),
  ('manager', 'view_reports')
on conflict (role, permission) do nothing;

create or replace function public.set_assigned_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.assigned_default_organization_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id
  from public.assigned_organizations
  where slug = 'samaya'
  limit 1;
$$;

create or replace function public.assigned_is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select membership.is_admin
    from public.assigned_memberships as membership
    where membership.user_id = coalesce(check_user_id, auth.uid())
    limit 1
  ), false);
$$;

create or replace function public.assigned_has_permission(
  permission_name text,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    public.assigned_is_admin(coalesce(check_user_id, auth.uid()))
    or exists (
      select 1
      from public.assigned_memberships as membership
      join public.assigned_role_permissions as role_permission
        on role_permission.role = membership.role
      where membership.user_id = coalesce(check_user_id, auth.uid())
        and role_permission.permission = permission_name
    );
$$;

create or replace function public.handle_assigned_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_org_id uuid;
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  metadata_full_name text := trim(coalesce(metadata ->> 'full_name', ''));
  metadata_first_name text := trim(
    coalesce(
      metadata ->> 'first_name',
      split_part(metadata_full_name, ' ', 1),
      ''
    )
  );
  metadata_last_name text := trim(
    coalesce(
      metadata ->> 'last_name',
      regexp_replace(metadata_full_name, '^[^ ]+\s*', ''),
      ''
    )
  );
  resolved_email text := coalesce(new.email, '');
begin
  assigned_org_id := public.assigned_default_organization_id();

  insert into public.assigned_user_profiles (
    user_id,
    email,
    first_name,
    last_name,
    display_name,
    avatar_url,
    timezone,
    onboarding_completed
  )
  values (
    new.id,
    resolved_email,
    metadata_first_name,
    metadata_last_name,
    trim(concat_ws(' ', metadata_first_name, metadata_last_name)),
    null,
    'America/Phoenix',
    false
  )
  on conflict (user_id) do nothing;

  if assigned_org_id is not null then
    insert into public.assigned_memberships (
      organization_id,
      user_id,
      role,
      is_admin,
      status
    )
    values (
      assigned_org_id,
      new.id,
      'field',
      false,
      'active'
    )
    on conflict (organization_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists set_assigned_organizations_updated_at on public.assigned_organizations;
create trigger set_assigned_organizations_updated_at
before update on public.assigned_organizations
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists set_assigned_user_profiles_updated_at on public.assigned_user_profiles;
create trigger set_assigned_user_profiles_updated_at
before update on public.assigned_user_profiles
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists set_assigned_memberships_updated_at on public.assigned_memberships;
create trigger set_assigned_memberships_updated_at
before update on public.assigned_memberships
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists on_auth_user_created_assigned on auth.users;
create trigger on_auth_user_created_assigned
after insert on auth.users
for each row
execute function public.handle_assigned_new_user();

alter table public.assigned_organizations enable row level security;
alter table public.assigned_user_profiles enable row level security;
alter table public.assigned_memberships enable row level security;
alter table public.assigned_role_permissions enable row level security;

grant usage on schema public to authenticated;
grant usage on schema public to service_role;

grant select on table public.assigned_organizations to authenticated;
grant select on table public.assigned_role_permissions to authenticated;
grant select, insert, update on table public.assigned_user_profiles to authenticated;
grant select, insert, update on table public.assigned_memberships to authenticated;

grant all on table public.assigned_organizations to service_role;
grant all on table public.assigned_user_profiles to service_role;
grant all on table public.assigned_memberships to service_role;
grant all on table public.assigned_role_permissions to service_role;

grant execute on function public.assigned_default_organization_id() to authenticated, service_role;
grant execute on function public.assigned_is_admin(uuid) to authenticated, service_role;
grant execute on function public.assigned_has_permission(text, uuid) to authenticated, service_role;

drop policy if exists "assigned organizations select" on public.assigned_organizations;
create policy "assigned organizations select"
on public.assigned_organizations
for select
to authenticated
using (true);

drop policy if exists "assigned role permissions select" on public.assigned_role_permissions;
create policy "assigned role permissions select"
on public.assigned_role_permissions
for select
to authenticated
using (true);

drop policy if exists "assigned profiles select own" on public.assigned_user_profiles;
create policy "assigned profiles select own"
on public.assigned_user_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or public.assigned_has_permission('manage_users', auth.uid())
);

drop policy if exists "assigned profiles insert own" on public.assigned_user_profiles;
create policy "assigned profiles insert own"
on public.assigned_user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "assigned profiles update own or admin" on public.assigned_user_profiles;
create policy "assigned profiles update own or admin"
on public.assigned_user_profiles
for update
to authenticated
using (
  auth.uid() = user_id
  or public.assigned_has_permission('manage_users', auth.uid())
)
with check (
  auth.uid() = user_id
  or public.assigned_has_permission('manage_users', auth.uid())
);

drop policy if exists "assigned memberships select own or admin" on public.assigned_memberships;
create policy "assigned memberships select own or admin"
on public.assigned_memberships
for select
to authenticated
using (
  auth.uid() = user_id
  or public.assigned_has_permission('manage_users', auth.uid())
);

drop policy if exists "assigned memberships insert own default" on public.assigned_memberships;
create policy "assigned memberships insert own default"
on public.assigned_memberships
for insert
to authenticated
with check (
  auth.uid() = user_id
  and organization_id = public.assigned_default_organization_id()
  and role = 'field'
  and is_admin = false
  and status = 'active'
);

drop policy if exists "assigned memberships update admin" on public.assigned_memberships;
create policy "assigned memberships update admin"
on public.assigned_memberships
for update
to authenticated
using (public.assigned_has_permission('manage_users', auth.uid()))
with check (public.assigned_has_permission('manage_users', auth.uid()));
