-- Supabase schema for URL monitoring / serialization update checks
-- Run via: supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'check_status') then
    create type check_status as enum ('ok','changed','error');
  end if;
  if not exists (select 1 from pg_type where typname = 'diff_field') then
    create type diff_field as enum ('html','meta','screenshot','keywords');
  end if;
  if not exists (select 1 from pg_type where typname = 'notify_threshold') then
    create type notify_threshold as enum ('any','error','changed');
  end if;
  if not exists (select 1 from pg_type where typname = 'notify_type') then
    create type notify_type as enum ('email','discord','webhook');
  end if;
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type member_role as enum ('owner','admin','editor','viewer');
  end if;
end$$;

-- Tables
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid not null,
  role member_role not null default 'viewer',
  invited_by uuid,
  created_at timestamptz default now(),
  unique (project_id, user_id)
);

create table if not exists urls (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  url text not null check (url ~ '^https?://'),
  tags text[] default '{}'::text[],
  note text,
  expected_status int default 200,
  check_interval_minutes int default 1440, -- 1 day default for serialization checks; can be lowered per URL
  active boolean default true,
  last_checked_at timestamptz,
  latest_item_id text,
  latest_item_published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_urls_project_active on urls(project_id, active);
create index if not exists idx_urls_tags on urls using gin(tags);

create table if not exists keywords (
  id uuid primary key default gen_random_uuid(),
  url_id uuid references urls(id) on delete cascade,
  phrase text not null,
  must_exist boolean default true,
  created_at timestamptz default now(),
  unique (url_id, phrase, must_exist)
);

create table if not exists checks (
  id uuid primary key default gen_random_uuid(),
  url_id uuid references urls(id) on delete cascade,
  started_at timestamptz not null,
  finished_at timestamptz,
  status check_status not null,
  http_status int,
  response_ms int,
  content_hash text,
  meta_hash text,
  screenshot_path text,
  final_url text,
  redirect_count int,
  ssl_expires_at timestamptz,
  error_message text
);
create index if not exists idx_checks_url_started on checks(url_id, started_at desc);
create index if not exists idx_checks_status on checks(url_id) where status = 'error';

create table if not exists diffs (
  id uuid primary key default gen_random_uuid(),
  check_id uuid references checks(id) on delete cascade,
  field diff_field not null,
  diff_summary jsonb,
  severity int default 1,
  created_at timestamptz default now()
);
create index if not exists idx_diffs_check_field on diffs(check_id, field);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type notify_type not null,
  endpoint text,
  enabled boolean default true,
  threshold notify_threshold default 'error',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  project_id uuid,
  user_id uuid,
  action text,
  target_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_audit_project_created on audit_logs(project_id, created_at desc);

-- Helper view: due_urls (for the function batch selection)
create or replace view due_urls as
select u.*
from urls u
where u.active
  and (
    u.last_checked_at is null
    or u.last_checked_at + (u.check_interval_minutes || ' minutes')::interval <= now()
  )
order by u.last_checked_at nulls first
limit 50;

-- RLS policies
alter table projects enable row level security;
alter table project_members enable row level security;
alter table urls enable row level security;
alter table keywords enable row level security;
alter table checks enable row level security;
alter table diffs enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- Helper predicate for membership (inline subqueries)
-- projects
create policy if not exists "projects select" on projects
for select using (
  exists (select 1 from project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid())
);
create policy if not exists "projects modify" on projects
for all using (
  projects.owner_id = auth.uid()
);

-- project_members
create policy if not exists "project_members select" on project_members
for select using (
  exists (select 1 from project_members pm where pm.project_id = project_members.project_id and pm.user_id = auth.uid())
);
create policy if not exists "project_members modify" on project_members
for all using (
  exists (
    select 1 from project_members pm
    where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin')
  )
);

-- urls
create policy if not exists "urls select" on urls
for select using (
  exists (select 1 from project_members pm where pm.project_id = urls.project_id and pm.user_id = auth.uid())
);
create policy if not exists "urls modify" on urls
for all using (
  exists (
    select 1 from project_members pm
    where pm.project_id = urls.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin','editor')
  )
);

-- keywords
create policy if not exists "keywords select" on keywords
for select using (
  exists (
    select 1 from project_members pm
    join urls u on u.id = keywords.url_id
    where pm.project_id = u.project_id and pm.user_id = auth.uid()
  )
);
create policy if not exists "keywords modify" on keywords
for all using (
  exists (
    select 1 from project_members pm
    join urls u on u.id = keywords.url_id
    where pm.project_id = u.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin','editor')
  )
);

-- checks
create policy if not exists "checks select" on checks
for select using (
  exists (
    select 1 from project_members pm
    join urls u on u.id = checks.url_id
    where pm.project_id = u.project_id and pm.user_id = auth.uid()
  )
);
-- writes typically via service role; allow owners/admin/editor if needed
create policy if not exists "checks insert" on checks
for insert with check (
  exists (
    select 1 from project_members pm
    join urls u on u.id = checks.url_id
    where pm.project_id = u.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin','editor')
  )
);

-- diffs
create policy if not exists "diffs select" on diffs
for select using (
  exists (
    select 1 from project_members pm
    join checks c on c.id = diffs.check_id
    join urls u on u.id = c.url_id
    where pm.project_id = u.project_id and pm.user_id = auth.uid()
  )
);

-- notifications
create policy if not exists "notifications select" on notifications
for select using (
  exists (select 1 from project_members pm where pm.project_id = notifications.project_id and pm.user_id = auth.uid())
);
create policy if not exists "notifications modify" on notifications
for all using (
  exists (
    select 1 from project_members pm
    where pm.project_id = notifications.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin','editor')
  )
);

-- audit_logs (read-only)
create policy if not exists "audit_logs select" on audit_logs
for select using (
  exists (select 1 from project_members pm where pm.project_id = audit_logs.project_id and pm.user_id = auth.uid())
);

-- Defaults/automation helpers
-- auto-add owner as project_member on project insert
create or replace function handle_project_insert()
returns trigger as $$
begin
  insert into project_members (project_id, user_id, role, invited_by)
  values (new.id, new.owner_id, 'owner', new.owner_id)
  on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_projects_add_owner on projects;
create trigger trg_projects_add_owner
after insert on projects
for each row execute procedure handle_project_insert();

-- touch updated_at on updates
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at before update on projects
for each row execute procedure set_updated_at();

drop trigger if exists trg_urls_updated_at on urls;
create trigger trg_urls_updated_at before update on urls
for each row execute procedure set_updated_at();
