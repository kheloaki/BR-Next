-- Export log (états) + rapports chantier

create table if not exists public.admin_report_exports (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  report_kind text not null default 'etat',
  report_module text,
  report_format text not null,
  status text not null default 'exported',
  period_from date,
  period_to date,
  filename text not null default '',
  generated_by text,
  created_at timestamptz not null default now(),
  constraint admin_report_exports_kind_check
    check (report_kind in ('etat', 'pv', 'rapport')),
  constraint admin_report_exports_status_check
    check (status in ('draft', 'generated', 'exported')),
  constraint admin_report_exports_format_check
    check (report_format in ('json', 'pdf', 'excel', 'csv', 'html'))
);

create index if not exists idx_admin_report_exports_org_project
  on public.admin_report_exports (organization_id, project_id, created_at desc);

create table if not exists public.admin_site_reports (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  report_type text not null,
  number text not null,
  status text not null default 'draft',
  report_date date not null default current_date,
  period_from date,
  period_to date,
  activities text not null default '',
  quantities text not null default '',
  blockers text not null default '',
  next_actions text not null default '',
  notes text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_site_reports_status_check
    check (status in ('draft', 'submitted', 'validated', 'archived')),
  constraint admin_site_reports_type_check
    check (report_type in (
      'journalier',
      'hebdomadaire',
      'avancement',
      'production',
      'photos',
      'gasoil',
      'materiel',
      'personnel'
    ))
);

create unique index if not exists idx_admin_site_reports_org_number
  on public.admin_site_reports (organization_id, number);

create index if not exists idx_admin_site_reports_org_project
  on public.admin_site_reports (organization_id, project_id, report_date desc);

drop trigger if exists trg_admin_site_reports_updated_at on public.admin_site_reports;
create trigger trg_admin_site_reports_updated_at
before update on public.admin_site_reports
for each row execute function public.touch_updated_at();
