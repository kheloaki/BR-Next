-- Procès-verbaux chantier (PV)

create table if not exists public.admin_site_pv (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  pv_type text not null,
  number text not null,
  status text not null default 'draft',
  pv_date date not null default current_date,
  object text not null default '',
  observations text not null default '',
  decisions text not null default '',
  reserves text not null default '',
  participants jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  responsible_person text not null default '',
  deadline date,
  signatures jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_site_pv_status_check
    check (status in ('draft', 'sent', 'signed', 'accepted', 'accepted_with_reserves', 'rejected', 'archived')),
  constraint admin_site_pv_type_check
    check (pv_type in (
      'reunion_chantier',
      'visite_chantier',
      'reception_provisoire',
      'reception_definitive',
      'levee_reserves',
      'mise_disposition_materiel',
      'retour_materiel',
      'incident'
    ))
);

create unique index if not exists idx_admin_site_pv_org_number
  on public.admin_site_pv (organization_id, number);

create index if not exists idx_admin_site_pv_org_project
  on public.admin_site_pv (organization_id, project_id, pv_date desc);

create index if not exists idx_admin_site_pv_org_status
  on public.admin_site_pv (organization_id, status);

drop trigger if exists trg_admin_site_pv_updated_at on public.admin_site_pv;
create trigger trg_admin_site_pv_updated_at
before update on public.admin_site_pv
for each row execute function public.touch_updated_at();
