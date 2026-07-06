-- BARANE INVEST — Master data (run after 01-commercial.sql)
-- Projects (chantiers), depots, equipment, employees — no admin_sites

create table if not exists public.admin_projects (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  code text not null default '',
  name text not null,
  client_name text not null default '',
  status text not null default 'active',
  start_date date,
  end_date date,
  location text not null default '',
  address text not null default '',
  manager_name text not null default '',
  market_number text not null default '',
  market_description text not null default '',
  chantier_document_url text not null default '',
  plan_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_projects_status_check
    check (status in ('draft', 'active', 'suspended', 'closed'))
);

create index if not exists idx_admin_projects_user_id
  on public.admin_projects (user_id);

create index if not exists idx_admin_projects_status
  on public.admin_projects (user_id, status);

create unique index if not exists idx_admin_projects_user_name
  on public.admin_projects (user_id, lower(name));

create unique index if not exists idx_admin_projects_user_code
  on public.admin_projects (user_id, lower(code))
  where code <> '';

create table if not exists public.admin_depots (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  name text not null,
  address text not null default '',
  depot_type text not null default 'central',
  project_id text references public.admin_projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_depots_type_check
    check (depot_type in ('central', 'site', 'other'))
);

create index if not exists idx_admin_depots_user_id
  on public.admin_depots (user_id);

create unique index if not exists idx_admin_depots_user_name
  on public.admin_depots (user_id, lower(name));

create index if not exists idx_admin_depots_project
  on public.admin_depots (user_id, project_id);

create table if not exists public.admin_equipment (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  name text not null,
  type text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_equipment_user_id
  on public.admin_equipment (user_id);

create table if not exists public.admin_employees (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  cin text not null default '',
  name text not null,
  role text not null default '',
  address text not null default '',
  birth_date date,
  default_project_id text references public.admin_projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_employees_user_id
  on public.admin_employees (user_id);

create index if not exists idx_admin_employees_default_project
  on public.admin_employees (user_id, default_project_id);

drop trigger if exists trg_admin_projects_updated_at on public.admin_projects;
create trigger trg_admin_projects_updated_at
before update on public.admin_projects
for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_depots_updated_at on public.admin_depots;
create trigger trg_admin_depots_updated_at
before update on public.admin_depots
for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_equipment_updated_at on public.admin_equipment;
create trigger trg_admin_equipment_updated_at
before update on public.admin_equipment
for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_employees_updated_at on public.admin_employees;
create trigger trg_admin_employees_updated_at
before update on public.admin_employees
for each row execute function public.touch_updated_at();
