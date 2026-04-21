do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'assigned_task_priority'
  ) then
    create type public.assigned_task_priority as enum ('low', 'medium', 'high');
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_enum
    where enumtypid = 'public.assigned_task_status'::regtype
      and enumlabel = 'todo'
  ) and not exists (
    select 1
    from pg_enum
    where enumtypid = 'public.assigned_task_status'::regtype
      and enumlabel = 'open'
  ) then
    alter type public.assigned_task_status rename value 'todo' to 'open';
  end if;

  if exists (
    select 1
    from pg_enum
    where enumtypid = 'public.assigned_task_status'::regtype
      and enumlabel = 'blocked'
  ) and not exists (
    select 1
    from pg_enum
    where enumtypid = 'public.assigned_task_status'::regtype
      and enumlabel = 'on_hold'
  ) then
    alter type public.assigned_task_status rename value 'blocked' to 'on_hold';
  end if;

  if exists (
    select 1
    from pg_enum
    where enumtypid = 'public.assigned_task_status'::regtype
      and enumlabel = 'completed'
  ) and not exists (
    select 1
    from pg_enum
    where enumtypid = 'public.assigned_task_status'::regtype
      and enumlabel = 'done'
  ) then
    alter type public.assigned_task_status rename value 'completed' to 'done';
  end if;
end
$$;

alter table public.assigned_projects
  add column if not exists description text,
  add column if not exists lead_user_id uuid references auth.users (id) on delete set null,
  add column if not exists start_date date,
  add column if not exists end_date date;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assigned_projects'
      and column_name = 'location'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assigned_projects'
      and column_name = 'location_text'
  ) then
    alter table public.assigned_projects rename column location to location_text;
  end if;
end
$$;

alter table public.assigned_projects
  add column if not exists location_text text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assigned_projects'
      and column_name = 'location'
  ) then
    execute $sql$
      update public.assigned_projects
      set location_text = coalesce(location_text, location)
      where location is not null
    $sql$;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assigned_projects'
      and column_name = 'site_label'
  ) then
    alter table public.assigned_projects drop column site_label;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assigned_projects'
      and column_name = 'location'
  ) then
    alter table public.assigned_projects drop column location;
  end if;
end
$$;

alter table public.assigned_member_projects
  add column if not exists assigned_by_user_id uuid references auth.users (id) on delete set null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assigned_tasks'
      and column_name = 'due_at'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assigned_tasks'
      and column_name = 'due_date'
  ) then
    alter table public.assigned_tasks rename column due_at to due_date;
  end if;
end
$$;

alter table public.assigned_tasks
  add column if not exists due_date timestamptz,
  add column if not exists priority public.assigned_task_priority,
  add column if not exists category text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assigned_tasks'
      and column_name = 'due_at'
  ) then
    update public.assigned_tasks
    set due_date = coalesce(due_date, due_at)
    where due_at is not null;

    alter table public.assigned_tasks drop column due_at;
  end if;
end
$$;

update public.assigned_tasks
set created_by_user_id = coalesce(created_by_user_id, assignee_user_id)
where created_by_user_id is null
  and assignee_user_id is not null;

update public.assigned_tasks as task
set assignee_user_id = coalesce(
  task.assignee_user_id,
  task.created_by_user_id,
  (
    select membership.user_id
    from public.assigned_memberships as membership
    where membership.organization_id = task.organization_id
      and membership.status = 'active'
    order by
      case membership.access_level
        when 'admin' then 0
        when 'team_lead' then 1
        when 'employee' then 2
        else 3
      end,
      membership.created_at asc
    limit 1
  )
)
where task.assignee_user_id is null;

update public.assigned_tasks
set category = 'General'
where category is null
   or btrim(category) = '';

alter table public.assigned_tasks
  alter column title set not null,
  alter column status set default 'open',
  alter column assignee_user_id set not null,
  alter column created_by_user_id set not null,
  alter column category set not null;

create index if not exists assigned_tasks_org_status_idx
  on public.assigned_tasks (organization_id, status);

create index if not exists assigned_tasks_org_assignee_idx
  on public.assigned_tasks (organization_id, assignee_user_id);

create index if not exists assigned_tasks_org_project_idx
  on public.assigned_tasks (organization_id, project_id);

create table if not exists public.assigned_task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.assigned_tasks (id) on delete cascade,
  text text not null,
  is_completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists assigned_task_checklist_items_task_idx
  on public.assigned_task_checklist_items (task_id, sort_order, created_at);

create table if not exists public.assigned_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.assigned_tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists assigned_task_comments_task_idx
  on public.assigned_task_comments (task_id, created_at);

create table if not exists public.assigned_task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.assigned_tasks (id) on delete cascade,
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists assigned_task_attachments_task_idx
  on public.assigned_task_attachments (task_id, created_at);

alter table public.assigned_task_checklist_items enable row level security;
alter table public.assigned_task_comments enable row level security;
alter table public.assigned_task_attachments enable row level security;

grant select, insert, update, delete on table public.assigned_task_checklist_items to authenticated;
grant select, insert, update, delete on table public.assigned_task_comments to authenticated;
grant select, insert, update, delete on table public.assigned_task_attachments to authenticated;

grant all on table public.assigned_task_checklist_items to service_role;
grant all on table public.assigned_task_comments to service_role;
grant all on table public.assigned_task_attachments to service_role;

delete from public.assigned_access_level_permissions
where permission in ('create_tasks');

insert into public.assigned_access_level_permissions (access_level, permission)
values
  ('employee', 'create_tasks'),
  ('team_lead', 'create_tasks'),
  ('admin', 'create_tasks')
on conflict (access_level, permission) do nothing;

create or replace function public.assigned_can_view_task_row(
  task_assignee_user_id uuid,
  task_created_by_user_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(check_user_id, auth.uid()) is not null
    and (
      task_assignee_user_id = coalesce(check_user_id, auth.uid())
      or task_created_by_user_id = coalesce(check_user_id, auth.uid())
      or public.assigned_is_admin(coalesce(check_user_id, auth.uid()))
      or (
        public.assigned_has_permission('view_detailed_workload', coalesce(check_user_id, auth.uid()))
        and (
          public.assigned_shares_team_with(task_assignee_user_id, coalesce(check_user_id, auth.uid()))
          or public.assigned_shares_team_with(task_created_by_user_id, coalesce(check_user_id, auth.uid()))
        )
      )
    );
$$;

create or replace function public.assigned_can_manage_task_row(
  task_assignee_user_id uuid,
  task_created_by_user_id uuid,
  check_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(check_user_id, auth.uid()) is not null
    and (
      public.assigned_is_admin(coalesce(check_user_id, auth.uid()))
      or (
        task_assignee_user_id = coalesce(check_user_id, auth.uid())
        and public.assigned_has_permission('update_own_tasks', coalesce(check_user_id, auth.uid()))
      )
      or (
        task_created_by_user_id = coalesce(check_user_id, auth.uid())
        and public.assigned_has_permission('create_tasks', coalesce(check_user_id, auth.uid()))
      )
      or public.assigned_can_manage_task_assignee(
        task_assignee_user_id,
        coalesce(check_user_id, auth.uid())
      )
    );
$$;

grant execute on function public.assigned_can_view_task_row(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.assigned_can_manage_task_row(uuid, uuid, uuid) to authenticated, service_role;

drop policy if exists "assigned projects select internal" on public.assigned_projects;
create policy "assigned projects select internal"
on public.assigned_projects
for select
to authenticated
using (
  public.assigned_has_permission('view_workspace', auth.uid())
  or public.assigned_has_permission('view_team_directory', auth.uid())
);

drop policy if exists "assigned tasks select scoped" on public.assigned_tasks;
create policy "assigned tasks select scoped"
on public.assigned_tasks
for select
to authenticated
using (
  public.assigned_can_view_task_row(assignee_user_id, created_by_user_id, auth.uid())
);

drop policy if exists "assigned tasks insert scoped" on public.assigned_tasks;
create policy "assigned tasks insert scoped"
on public.assigned_tasks
for insert
to authenticated
with check (
  public.assigned_has_permission('create_tasks', auth.uid())
  and created_by_user_id = auth.uid()
  and category is not null
  and btrim(category) <> ''
  and assignee_user_id is not null
  and public.assigned_can_manage_task_assignee(assignee_user_id, auth.uid())
);

drop policy if exists "assigned tasks update scoped" on public.assigned_tasks;
create policy "assigned tasks update scoped"
on public.assigned_tasks
for update
to authenticated
using (
  public.assigned_can_manage_task_row(assignee_user_id, created_by_user_id, auth.uid())
)
with check (
  public.assigned_can_manage_task_row(assignee_user_id, created_by_user_id, auth.uid())
);

drop policy if exists "assigned task checklist items select scoped" on public.assigned_task_checklist_items;
create policy "assigned task checklist items select scoped"
on public.assigned_task_checklist_items
for select
to authenticated
using (
  exists (
    select 1
    from public.assigned_tasks as task
    where task.id = task_id
      and public.assigned_can_view_task_row(task.assignee_user_id, task.created_by_user_id, auth.uid())
  )
);

drop policy if exists "assigned task checklist items manage scoped" on public.assigned_task_checklist_items;
create policy "assigned task checklist items manage scoped"
on public.assigned_task_checklist_items
for all
to authenticated
using (
  exists (
    select 1
    from public.assigned_tasks as task
    where task.id = task_id
      and public.assigned_can_manage_task_row(task.assignee_user_id, task.created_by_user_id, auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.assigned_tasks as task
    where task.id = task_id
      and public.assigned_can_manage_task_row(task.assignee_user_id, task.created_by_user_id, auth.uid())
  )
);

drop policy if exists "assigned task comments select scoped" on public.assigned_task_comments;
create policy "assigned task comments select scoped"
on public.assigned_task_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.assigned_tasks as task
    where task.id = task_id
      and public.assigned_can_view_task_row(task.assignee_user_id, task.created_by_user_id, auth.uid())
  )
);

drop policy if exists "assigned task comments insert scoped" on public.assigned_task_comments;
create policy "assigned task comments insert scoped"
on public.assigned_task_comments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.assigned_tasks as task
    where task.id = task_id
      and public.assigned_can_view_task_row(task.assignee_user_id, task.created_by_user_id, auth.uid())
  )
);

drop policy if exists "assigned task attachments select scoped" on public.assigned_task_attachments;
create policy "assigned task attachments select scoped"
on public.assigned_task_attachments
for select
to authenticated
using (
  exists (
    select 1
    from public.assigned_tasks as task
    where task.id = task_id
      and public.assigned_can_view_task_row(task.assignee_user_id, task.created_by_user_id, auth.uid())
  )
);

drop policy if exists "assigned task attachments manage scoped" on public.assigned_task_attachments;
create policy "assigned task attachments manage scoped"
on public.assigned_task_attachments
for all
to authenticated
using (
  exists (
    select 1
    from public.assigned_tasks as task
    where task.id = task_id
      and public.assigned_can_manage_task_row(task.assignee_user_id, task.created_by_user_id, auth.uid())
  )
)
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.assigned_tasks as task
    where task.id = task_id
      and public.assigned_can_manage_task_row(task.assignee_user_id, task.created_by_user_id, auth.uid())
  )
);
