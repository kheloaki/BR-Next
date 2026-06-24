-- BARANE INVEST — Project budget + labor cost entries (fiche projet dashboard)

alter table public.admin_projects
  add column if not exists budget_mad numeric not null default 0;

create table if not exists public.admin_project_labor_entries (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  project_id text not null references public.admin_projects(id) on delete cascade,
  employee_id text references public.admin_employees(id) on delete set null,
  employee_name text not null default '',
  work_date date not null default current_date,
  days_worked numeric not null default 1,
  daily_rate numeric not null default 0,
  amount numeric not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_project_labor_org_project_date
  on public.admin_project_labor_entries (organization_id, project_id, work_date desc);
