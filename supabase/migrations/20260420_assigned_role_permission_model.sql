do $$
begin
  if not exists (select 1 from pg_type where typname = 'assigned_role_v2') then
    create type public.assigned_role_v2 as enum ('technician', 'viewer', 'supervisor', 'external');
  end if;
end
$$;

drop policy if exists "assigned memberships insert own default" on public.assigned_memberships;

drop trigger if exists on_auth_user_created_assigned on auth.users;
drop function if exists public.handle_assigned_new_user();

alter table public.assigned_memberships
  alter column role drop default;

alter table public.assigned_memberships
  alter column role type public.assigned_role_v2
  using (
    case role::text
      when 'field' then 'technician'
      when 'office' then 'supervisor'
      when 'manager' then 'supervisor'
      else role::text
    end
  )::public.assigned_role_v2;

delete from public.assigned_role_permissions;

alter table public.assigned_role_permissions
  alter column role type public.assigned_role_v2
  using nullif(role::text, '')::public.assigned_role_v2;

drop type if exists public.assigned_role;
alter type public.assigned_role_v2 rename to assigned_role;

alter table public.assigned_memberships
  alter column role set default 'technician';

insert into public.assigned_role_permissions (role, permission)
values
  ('technician', 'view_workspace'),
  ('technician', 'view_own_tasks'),
  ('technician', 'update_own_tasks'),
  ('technician', 'complete_own_tasks'),
  ('technician', 'view_team_directory'),
  ('viewer', 'view_workspace'),
  ('viewer', 'view_own_tasks'),
  ('viewer', 'view_team_directory'),
  ('supervisor', 'view_workspace'),
  ('supervisor', 'view_own_tasks'),
  ('supervisor', 'update_own_tasks'),
  ('supervisor', 'complete_own_tasks'),
  ('supervisor', 'view_team_directory'),
  ('supervisor', 'view_detailed_workload'),
  ('supervisor', 'view_inactive_users'),
  ('supervisor', 'create_tasks'),
  ('supervisor', 'assign_tasks'),
  ('supervisor', 'edit_users'),
  ('external', 'view_workspace'),
  ('external', 'view_own_tasks')
on conflict (role, permission) do nothing;

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
      'technician',
      false,
      'active'
    )
    on conflict (organization_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created_assigned
after insert on auth.users
for each row
execute function public.handle_assigned_new_user();

drop policy if exists "assigned profiles select own" on public.assigned_user_profiles;
create policy "assigned profiles select own"
on public.assigned_user_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or public.assigned_has_permission('edit_users', auth.uid())
);

drop policy if exists "assigned profiles update own or admin" on public.assigned_user_profiles;
create policy "assigned profiles update own or admin"
on public.assigned_user_profiles
for update
to authenticated
using (
  auth.uid() = user_id
  or public.assigned_has_permission('edit_users', auth.uid())
)
with check (
  auth.uid() = user_id
  or public.assigned_has_permission('edit_users', auth.uid())
);

drop policy if exists "assigned memberships select own or admin" on public.assigned_memberships;
create policy "assigned memberships select own or admin"
on public.assigned_memberships
for select
to authenticated
using (
  auth.uid() = user_id
  or public.assigned_has_permission('edit_users', auth.uid())
);

create policy "assigned memberships insert own default"
on public.assigned_memberships
for insert
to authenticated
with check (
  auth.uid() = user_id
  and organization_id = public.assigned_default_organization_id()
  and role = 'technician'
  and is_admin = false
  and status = 'active'
);

drop policy if exists "assigned memberships update admin" on public.assigned_memberships;
create policy "assigned memberships update admin"
on public.assigned_memberships
for update
to authenticated
using (public.assigned_has_permission('manage_permissions', auth.uid()))
with check (public.assigned_has_permission('manage_permissions', auth.uid()));
