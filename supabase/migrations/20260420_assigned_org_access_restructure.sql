create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'assigned_access_level') then
    create type public.assigned_access_level as enum ('employee', 'team_lead', 'admin', 'external');
  end if;

  if not exists (select 1 from pg_type where typname = 'assigned_member_status') then
    create type public.assigned_member_status as enum ('active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'assigned_availability_status') then
    create type public.assigned_availability_status as enum ('available', 'busy', 'on_leave');
  end if;

  if not exists (select 1 from pg_type where typname = 'assigned_project_status') then
    create type public.assigned_project_status as enum ('active', 'planning', 'handover', 'on_hold');
  end if;

  if not exists (select 1 from pg_type where typname = 'assigned_task_status') then
    create type public.assigned_task_status as enum ('todo', 'in_progress', 'blocked', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'assigned_activity_kind') then
    create type public.assigned_activity_kind as enum ('assignment', 'completion', 'comment', 'update');
  end if;
end
$$;

alter table if exists public.assigned_user_profiles
  add column if not exists phone text;

drop policy if exists "assigned memberships insert own default" on public.assigned_memberships;
drop policy if exists "assigned memberships update admin" on public.assigned_memberships;
drop policy if exists "assigned memberships select own or admin" on public.assigned_memberships;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'assigned_memberships'
  ) then
    alter table public.assigned_memberships
      add column if not exists access_level public.assigned_access_level,
      add column if not exists team_id uuid,
      add column if not exists position_id uuid,
      add column if not exists manager_user_id uuid,
      add column if not exists availability public.assigned_availability_status default 'available';

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'assigned_memberships'
        and column_name = 'role'
    ) then
      execute $sql$
        update public.assigned_memberships
        set access_level = case
          when coalesce(is_admin, false) then 'admin'::public.assigned_access_level
          when role::text in ('supervisor', 'manager') then 'team_lead'::public.assigned_access_level
          when role::text = 'external' then 'external'::public.assigned_access_level
          else 'employee'::public.assigned_access_level
        end
        where access_level is null
      $sql$;
    else
      update public.assigned_memberships
      set access_level = case
        when coalesce(is_admin, false) then 'admin'::public.assigned_access_level
        else coalesce(access_level, 'employee'::public.assigned_access_level)
      end
      where access_level is null or coalesce(is_admin, false);
    end if;

    update public.assigned_memberships
    set access_level = 'admin'
    where coalesce(is_admin, false)
      and access_level is distinct from 'admin';

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'assigned_memberships'
        and column_name = 'status'
        and udt_name not in ('assigned_member_status')
    ) then
      alter table public.assigned_memberships add column if not exists status_v2 public.assigned_member_status default 'active';
      execute $sql$
        update public.assigned_memberships
        set status_v2 = case
          when lower(coalesce(status::text, 'active')) = 'inactive' then 'inactive'::public.assigned_member_status
          else 'active'::public.assigned_member_status
        end
      $sql$;
      alter table public.assigned_memberships drop column status;
      alter table public.assigned_memberships rename column status_v2 to status;
    elsif not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'assigned_memberships'
        and column_name = 'status'
    ) then
      alter table public.assigned_memberships add column status public.assigned_member_status not null default 'active';
    end if;

    alter table public.assigned_memberships
      alter column access_level set default 'employee',
      alter column access_level set not null,
      alter column status set default 'active',
      alter column status set not null,
      alter column availability set default 'available',
      alter column availability set not null;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'assigned_memberships'
        and column_name = 'role'
    ) then
      alter table public.assigned_memberships drop column role;
    end if;
  end if;
end
$$;

drop table if exists public.assigned_role_permissions;

do $$
begin
  if exists (select 1 from pg_type where typname = 'assigned_role') then
    drop type public.assigned_role;
  end if;
exception
  when dependent_objects_still_exist then
    null;
end
$$;

create table if not exists public.assigned_teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.assigned_organizations (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  lead_user_id uuid references auth.users (id) on delete set null,
  parent_department text,
  color text not null default '#1f7a53',
  icon text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, slug)
);

create table if not exists public.assigned_positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.assigned_organizations (id) on delete cascade,
  team_id uuid not null references public.assigned_teams (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, team_id, slug)
);

create table if not exists public.assigned_projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.assigned_organizations (id) on delete cascade,
  slug text not null,
  name text not null,
  site_label text,
  location text,
  status public.assigned_project_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (organization_id, slug)
);

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name = 'assigned_memberships'
  ) then
    begin
      alter table public.assigned_memberships
        add constraint assigned_memberships_team_id_fkey
        foreign key (team_id) references public.assigned_teams (id) on delete set null;
    exception when duplicate_object then null; end;

    begin
      alter table public.assigned_memberships
        add constraint assigned_memberships_position_id_fkey
        foreign key (position_id) references public.assigned_positions (id) on delete set null;
    exception when duplicate_object then null; end;

    begin
      alter table public.assigned_memberships
        add constraint assigned_memberships_manager_user_id_fkey
        foreign key (manager_user_id) references auth.users (id) on delete set null;
    exception when duplicate_object then null; end;
  end if;
end
$$;

create table if not exists public.assigned_access_level_permissions (
  access_level public.assigned_access_level not null,
  permission text not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (access_level, permission)
);

delete from public.assigned_access_level_permissions;
insert into public.assigned_access_level_permissions (access_level, permission)
values
  ('employee', 'view_workspace'),
  ('employee', 'view_own_tasks'),
  ('employee', 'update_own_tasks'),
  ('employee', 'complete_own_tasks'),
  ('employee', 'view_team_directory'),
  ('team_lead', 'view_workspace'),
  ('team_lead', 'view_own_tasks'),
  ('team_lead', 'update_own_tasks'),
  ('team_lead', 'complete_own_tasks'),
  ('team_lead', 'view_team_directory'),
  ('team_lead', 'view_detailed_workload'),
  ('team_lead', 'create_tasks'),
  ('team_lead', 'assign_tasks'),
  ('admin', 'view_workspace'),
  ('admin', 'view_own_tasks'),
  ('admin', 'update_own_tasks'),
  ('admin', 'complete_own_tasks'),
  ('admin', 'view_team_directory'),
  ('admin', 'view_detailed_workload'),
  ('admin', 'create_tasks'),
  ('admin', 'assign_tasks'),
  ('admin', 'view_inactive_users'),
  ('admin', 'edit_users'),
  ('admin', 'manage_permissions'),
  ('admin', 'manage_teams'),
  ('admin', 'manage_positions'),
  ('admin', 'assign_projects'),
  ('external', 'view_own_tasks')
on conflict (access_level, permission) do nothing;

create table if not exists public.assigned_team_projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.assigned_teams (id) on delete cascade,
  project_id uuid not null references public.assigned_projects (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (team_id, project_id)
);

create table if not exists public.assigned_member_projects (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.assigned_memberships (id) on delete cascade,
  project_id uuid not null references public.assigned_projects (id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (membership_id, project_id)
);

create table if not exists public.assigned_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.assigned_organizations (id) on delete cascade,
  title text not null,
  description text,
  status public.assigned_task_status not null default 'todo',
  assignee_user_id uuid references auth.users (id) on delete set null,
  created_by_user_id uuid references auth.users (id) on delete set null,
  project_id uuid references public.assigned_projects (id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  blocked_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.assigned_activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.assigned_organizations (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  task_id uuid references public.assigned_tasks (id) on delete set null,
  project_id uuid references public.assigned_projects (id) on delete set null,
  kind public.assigned_activity_kind not null,
  summary text not null,
  created_at timestamptz not null default timezone('utc', now())
);

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

create or replace function public.sync_assigned_admin_flag()
returns trigger
language plpgsql
as $$
begin
  new.is_admin = new.access_level = 'admin';
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
    select membership.access_level = 'admin' or membership.is_admin
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
      join public.assigned_access_level_permissions as permission_map
        on permission_map.access_level = membership.access_level
      where membership.user_id = coalesce(check_user_id, auth.uid())
        and permission_map.permission = permission_name
    );
$$;

create or replace function public.assigned_shares_team_with(
  target_user_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.assigned_memberships as requester
    join public.assigned_memberships as target
      on target.organization_id = requester.organization_id
     and target.user_id = target_user_id
    where requester.user_id = coalesce(check_user_id, auth.uid())
      and requester.team_id is not null
      and requester.team_id = target.team_id
      and requester.status = 'active'
      and target.status = 'active'
  );
$$;

create or replace function public.assigned_can_manage_task_assignee(
  target_user_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    target_user_id = coalesce(check_user_id, auth.uid())
    or public.assigned_is_admin(coalesce(check_user_id, auth.uid()))
    or (
      public.assigned_has_permission('assign_tasks', coalesce(check_user_id, auth.uid()))
      and public.assigned_shares_team_with(target_user_id, coalesce(check_user_id, auth.uid()))
    );
$$;

create or replace function public.assigned_can_view_task(
  target_user_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    target_user_id = coalesce(check_user_id, auth.uid())
    or public.assigned_is_admin(coalesce(check_user_id, auth.uid()))
    or (
      public.assigned_has_permission('view_detailed_workload', coalesce(check_user_id, auth.uid()))
      and public.assigned_shares_team_with(target_user_id, coalesce(check_user_id, auth.uid()))
    );
$$;

create or replace function public.assigned_bootstrap_admin_available(
  organization_id uuid default public.assigned_default_organization_id()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((
    select count(*) = 0
    from public.assigned_memberships
    where organization_id = assigned_bootstrap_admin_available.organization_id
      and access_level = 'admin'
  ), true);
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
    phone,
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
    null,
    'America/Phoenix',
    false
  )
  on conflict (user_id) do nothing;

  if assigned_org_id is not null then
    insert into public.assigned_memberships (
      organization_id,
      user_id,
      access_level,
      status,
      availability
    )
    values (
      assigned_org_id,
      new.id,
      'employee',
      'active',
      'available'
    )
    on conflict (organization_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

create or replace function public.assigned_claim_bootstrap_admin()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  assigned_org_id uuid := public.assigned_default_organization_id();
  membership_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  if assigned_org_id is null then
    raise exception 'Default organization is missing.';
  end if;

  if not public.assigned_bootstrap_admin_available(assigned_org_id) then
    raise exception 'Admin bootstrap is no longer available for this organization.';
  end if;

  update public.assigned_memberships
  set
    access_level = 'admin',
    status = 'active',
    availability = coalesce(availability, 'available'),
    updated_at = timezone('utc', now())
  where organization_id = assigned_org_id
    and user_id = current_user_id
  returning id into membership_id;

  if membership_id is null then
    insert into public.assigned_memberships (
      organization_id,
      user_id,
      access_level,
      status,
      availability
    )
    values (
      assigned_org_id,
      current_user_id,
      'admin',
      'active',
      'available'
    )
    returning id into membership_id;
  end if;

  return jsonb_build_object(
    'organization_id', assigned_org_id,
    'membership_id', membership_id,
    'access_level', 'admin'
  );
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

drop trigger if exists set_assigned_teams_updated_at on public.assigned_teams;
create trigger set_assigned_teams_updated_at
before update on public.assigned_teams
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists set_assigned_positions_updated_at on public.assigned_positions;
create trigger set_assigned_positions_updated_at
before update on public.assigned_positions
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists set_assigned_projects_updated_at on public.assigned_projects;
create trigger set_assigned_projects_updated_at
before update on public.assigned_projects
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists set_assigned_memberships_updated_at on public.assigned_memberships;
create trigger set_assigned_memberships_updated_at
before update on public.assigned_memberships
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists set_assigned_tasks_updated_at on public.assigned_tasks;
create trigger set_assigned_tasks_updated_at
before update on public.assigned_tasks
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists set_assigned_user_states_updated_at on public.assigned_user_states;
create trigger set_assigned_user_states_updated_at
before update on public.assigned_user_states
for each row
execute function public.set_assigned_updated_at();

drop trigger if exists sync_assigned_membership_admin_flag on public.assigned_memberships;
create trigger sync_assigned_membership_admin_flag
before insert or update on public.assigned_memberships
for each row
execute function public.sync_assigned_admin_flag();

drop trigger if exists on_auth_user_created_assigned on auth.users;
create trigger on_auth_user_created_assigned
after insert on auth.users
for each row
execute function public.handle_assigned_new_user();

with org as (
  select id
  from public.assigned_organizations
  where slug = 'samaya'
)
insert into public.assigned_teams (
  organization_id,
  slug,
  name,
  description,
  parent_department,
  color,
  icon
)
select org.id, value.slug, value.name, value.description, value.parent_department, value.color, value.icon
from org
cross join (
  values
    ('admin', 'Admin', 'Platform administration, permissions, and company-wide oversight.', 'Administration', '#111827', 'shield'),
    ('leadership', 'Leadership', 'Company direction, priorities, and executive oversight.', 'Leadership', '#374151', 'shield'),
    ('site-operations', 'Site Operations', 'Live site execution, supervision, and delivery coordination.', 'Operations', '#1f7a53', 'hard-hat'),
    ('procurement', 'Procurement', 'Material sourcing, vendor coordination, and purchase follow-through.', 'Operations', '#a86a12', 'box'),
    ('design-planning', 'Design & Planning', 'Drawings, planning, approvals, and preconstruction coordination.', 'Preconstruction', '#2563eb', 'pencil-ruler'),
    ('finance-admin', 'Finance & Admin', 'Accounts, billing, cash visibility, and internal admin operations.', 'Corporate', '#0f766e', 'calculator'),
    ('sales', 'Sales', 'Lead handling, client follow-ups, and booking coordination.', 'Business', '#c44949', 'briefcase'),
    ('marketing', 'Marketing', 'Campaigns, brand execution, and demand generation.', 'Business', '#7c3aed', 'megaphone'),
    ('crm', 'CRM', 'Lead routing, relationship maintenance, and customer handoff hygiene.', 'Business', '#0891b2', 'messages-square')
) as value(slug, name, description, parent_department, color, icon)
on conflict (organization_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  parent_department = excluded.parent_department,
  color = excluded.color,
  icon = excluded.icon,
  updated_at = timezone('utc', now());

with admin_team as (
  select id, organization_id
  from public.assigned_teams
  where slug = 'admin'
)
update public.assigned_memberships
set team_id = admin_team.id
from admin_team
where assigned_memberships.organization_id = admin_team.organization_id
  and assigned_memberships.access_level = 'admin'
  and assigned_memberships.team_id is null;

with org as (
  select id
  from public.assigned_organizations
  where slug = 'samaya'
),
team_lookup as (
  select id, slug, organization_id
  from public.assigned_teams
  where organization_id = (select id from org)
)
insert into public.assigned_positions (
  organization_id,
  team_id,
  slug,
  name,
  description
)
select team_lookup.organization_id, team_lookup.id, value.slug, value.name, value.description
from team_lookup
join (
  values
    ('leadership', 'founder', 'Founder', 'Leads the company and sets direction.'),
    ('leadership', 'project-manager', 'Project Manager', 'Owns delivery planning and project-level execution.'),
    ('site-operations', 'site-engineer', 'Site Engineer', 'Coordinates site execution, reporting, and follow-through.'),
    ('site-operations', 'civil-supervisor', 'Civil Supervisor', 'Supervises civil work packages and site progress.'),
    ('procurement', 'procurement-executive', 'Procurement Executive', 'Owns purchasing, vendor follow-up, and tracking.'),
    ('procurement', 'stores-coordinator', 'Stores Coordinator', 'Manages inward, outward, and stock visibility.'),
    ('design-planning', 'design-lead', 'Design Lead', 'Owns design direction and drawing coordination.'),
    ('design-planning', 'drafting-engineer', 'Drafting Engineer', 'Builds and updates drawing packages for execution.'),
    ('finance-admin', 'accountant', 'Accountant', 'Tracks accounts, billing, and internal finance workflows.'),
    ('finance-admin', 'admin-executive', 'Admin Executive', 'Handles company admin operations and support.'),
    ('sales', 'sales-executive', 'Sales Executive', 'Handles lead conversion and client follow-up.'),
    ('marketing', 'marketing-lead', 'Marketing Lead', 'Runs campaigns, positioning, and growth execution.'),
    ('crm', 'crm-executive', 'CRM Executive', 'Maintains lead data, pipeline hygiene, and customer follow-through.')
) as value(team_slug, slug, name, description)
  on value.team_slug = team_lookup.slug
on conflict (organization_id, team_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  updated_at = timezone('utc', now());

alter table public.assigned_organizations enable row level security;
alter table public.assigned_user_profiles enable row level security;
alter table public.assigned_teams enable row level security;
alter table public.assigned_positions enable row level security;
alter table public.assigned_projects enable row level security;
alter table public.assigned_memberships enable row level security;
alter table public.assigned_access_level_permissions enable row level security;
alter table public.assigned_team_projects enable row level security;
alter table public.assigned_member_projects enable row level security;
alter table public.assigned_tasks enable row level security;
alter table public.assigned_activity_log enable row level security;
alter table public.assigned_user_states enable row level security;

grant usage on schema public to authenticated;
grant usage on schema public to service_role;

grant select on table public.assigned_organizations to authenticated;
grant select, insert, update on table public.assigned_user_profiles to authenticated;
grant select, insert, update on table public.assigned_memberships to authenticated;
grant select on table public.assigned_access_level_permissions to authenticated;
grant select on table public.assigned_teams to authenticated;
grant select on table public.assigned_positions to authenticated;
grant select on table public.assigned_projects to authenticated;
grant select on table public.assigned_team_projects to authenticated;
grant select on table public.assigned_member_projects to authenticated;
grant select on table public.assigned_tasks to authenticated;
grant select on table public.assigned_activity_log to authenticated;
grant select, insert, update on table public.assigned_user_states to authenticated;

grant all on table public.assigned_organizations to service_role;
grant all on table public.assigned_user_profiles to service_role;
grant all on table public.assigned_teams to service_role;
grant all on table public.assigned_positions to service_role;
grant all on table public.assigned_projects to service_role;
grant all on table public.assigned_memberships to service_role;
grant all on table public.assigned_access_level_permissions to service_role;
grant all on table public.assigned_team_projects to service_role;
grant all on table public.assigned_member_projects to service_role;
grant all on table public.assigned_tasks to service_role;
grant all on table public.assigned_activity_log to service_role;
grant all on table public.assigned_user_states to service_role;

grant execute on function public.assigned_default_organization_id() to authenticated, service_role;
grant execute on function public.assigned_is_admin(uuid) to authenticated, service_role;
grant execute on function public.assigned_has_permission(text, uuid) to authenticated, service_role;
grant execute on function public.assigned_bootstrap_admin_available(uuid) to authenticated, service_role;
grant execute on function public.assigned_claim_bootstrap_admin() to authenticated, service_role;
grant execute on function public.assigned_shares_team_with(uuid, uuid) to authenticated, service_role;
grant execute on function public.assigned_can_manage_task_assignee(uuid, uuid) to authenticated, service_role;
grant execute on function public.assigned_can_view_task(uuid, uuid) to authenticated, service_role;

drop policy if exists "assigned organizations select" on public.assigned_organizations;
create policy "assigned organizations select"
on public.assigned_organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.assigned_memberships
    where organization_id = assigned_organizations.id
      and user_id = auth.uid()
  )
);

drop policy if exists "assigned profiles select own or admin" on public.assigned_user_profiles;
create policy "assigned profiles select own or admin"
on public.assigned_user_profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or public.assigned_has_permission('edit_users', auth.uid())
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

drop policy if exists "assigned memberships insert own default" on public.assigned_memberships;
create policy "assigned memberships insert own default"
on public.assigned_memberships
for insert
to authenticated
with check (
  auth.uid() = user_id
  and organization_id = public.assigned_default_organization_id()
  and access_level = 'employee'
  and status = 'active'
  and availability = 'available'
  and team_id is null
  and position_id is null
  and manager_user_id is null
  and is_admin = false
);

drop policy if exists "assigned memberships update admin" on public.assigned_memberships;
create policy "assigned memberships update admin"
on public.assigned_memberships
for update
to authenticated
using (public.assigned_has_permission('edit_users', auth.uid()))
with check (public.assigned_has_permission('edit_users', auth.uid()));

drop policy if exists "assigned access permissions select" on public.assigned_access_level_permissions;
create policy "assigned access permissions select"
on public.assigned_access_level_permissions
for select
to authenticated
using (true);

drop policy if exists "assigned teams select internal" on public.assigned_teams;
create policy "assigned teams select internal"
on public.assigned_teams
for select
to authenticated
using (public.assigned_has_permission('view_team_directory', auth.uid()));

drop policy if exists "assigned teams manage admin" on public.assigned_teams;
create policy "assigned teams manage admin"
on public.assigned_teams
for all
to authenticated
using (public.assigned_has_permission('manage_teams', auth.uid()))
with check (public.assigned_has_permission('manage_teams', auth.uid()));

drop policy if exists "assigned positions select internal" on public.assigned_positions;
create policy "assigned positions select internal"
on public.assigned_positions
for select
to authenticated
using (public.assigned_has_permission('view_team_directory', auth.uid()));

drop policy if exists "assigned positions manage admin" on public.assigned_positions;
create policy "assigned positions manage admin"
on public.assigned_positions
for all
to authenticated
using (public.assigned_has_permission('manage_positions', auth.uid()))
with check (public.assigned_has_permission('manage_positions', auth.uid()));

drop policy if exists "assigned projects select internal" on public.assigned_projects;
create policy "assigned projects select internal"
on public.assigned_projects
for select
to authenticated
using (public.assigned_has_permission('view_team_directory', auth.uid()));

drop policy if exists "assigned projects manage admin" on public.assigned_projects;
create policy "assigned projects manage admin"
on public.assigned_projects
for all
to authenticated
using (public.assigned_has_permission('assign_projects', auth.uid()))
with check (public.assigned_has_permission('assign_projects', auth.uid()));

drop policy if exists "assigned team projects select internal" on public.assigned_team_projects;
create policy "assigned team projects select internal"
on public.assigned_team_projects
for select
to authenticated
using (public.assigned_has_permission('view_team_directory', auth.uid()));

drop policy if exists "assigned team projects manage admin" on public.assigned_team_projects;
create policy "assigned team projects manage admin"
on public.assigned_team_projects
for all
to authenticated
using (public.assigned_has_permission('manage_teams', auth.uid()))
with check (public.assigned_has_permission('manage_teams', auth.uid()));

drop policy if exists "assigned member projects select own or internal" on public.assigned_member_projects;
create policy "assigned member projects select own or internal"
on public.assigned_member_projects
for select
to authenticated
using (
  exists (
    select 1
    from public.assigned_memberships
    where assigned_memberships.id = membership_id
      and assigned_memberships.user_id = auth.uid()
  )
  or public.assigned_has_permission('view_team_directory', auth.uid())
);

drop policy if exists "assigned member projects manage admin" on public.assigned_member_projects;
create policy "assigned member projects manage admin"
on public.assigned_member_projects
for all
to authenticated
using (public.assigned_has_permission('assign_projects', auth.uid()))
with check (public.assigned_has_permission('assign_projects', auth.uid()));

drop policy if exists "assigned tasks select scoped" on public.assigned_tasks;
create policy "assigned tasks select scoped"
on public.assigned_tasks
for select
to authenticated
using (
  assignee_user_id = auth.uid()
  or (
    assignee_user_id is not null
    and public.assigned_can_view_task(assignee_user_id, auth.uid())
  )
);

drop policy if exists "assigned tasks insert scoped" on public.assigned_tasks;
create policy "assigned tasks insert scoped"
on public.assigned_tasks
for insert
to authenticated
with check (
  public.assigned_has_permission('create_tasks', auth.uid())
  and (
    assignee_user_id is null
    or public.assigned_can_manage_task_assignee(assignee_user_id, auth.uid())
  )
);

drop policy if exists "assigned tasks update scoped" on public.assigned_tasks;
create policy "assigned tasks update scoped"
on public.assigned_tasks
for update
to authenticated
using (
  assignee_user_id = auth.uid()
  or (
    assignee_user_id is not null
    and public.assigned_can_manage_task_assignee(assignee_user_id, auth.uid())
  )
)
with check (
  assignee_user_id = auth.uid()
  or (
    assignee_user_id is not null
    and public.assigned_can_manage_task_assignee(assignee_user_id, auth.uid())
  )
);

drop policy if exists "assigned activity select scoped" on public.assigned_activity_log;
create policy "assigned activity select scoped"
on public.assigned_activity_log
for select
to authenticated
using (
  target_user_id = auth.uid()
  or public.assigned_is_admin(auth.uid())
  or (
    target_user_id is not null
    and public.assigned_has_permission('view_detailed_workload', auth.uid())
    and public.assigned_shares_team_with(target_user_id, auth.uid())
  )
);

drop policy if exists "assigned activity insert scoped" on public.assigned_activity_log;
create policy "assigned activity insert scoped"
on public.assigned_activity_log
for insert
to authenticated
with check (
  public.assigned_is_admin(auth.uid())
  or (
    target_user_id = auth.uid()
    and public.assigned_has_permission('update_own_tasks', auth.uid())
  )
  or (
    target_user_id is not null
    and public.assigned_has_permission('assign_tasks', auth.uid())
    and public.assigned_shares_team_with(target_user_id, auth.uid())
  )
);

drop policy if exists "assigned user states select own" on public.assigned_user_states;
create policy "assigned user states select own"
on public.assigned_user_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "assigned user states insert own" on public.assigned_user_states;
create policy "assigned user states insert own"
on public.assigned_user_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "assigned user states update own" on public.assigned_user_states;
create policy "assigned user states update own"
on public.assigned_user_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
