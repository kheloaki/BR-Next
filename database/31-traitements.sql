-- BARANE INVEST — Traitements achat / vente (suivi BC·BL·F·BR et Devis·BL·F·BR)

create table if not exists public.admin_traitements (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  organization_id text references public.admin_organizations(id) on delete cascade,
  traitement_type text not null check (traitement_type in ('achat', 'vente')),
  number text not null,
  label text not null default '',
  project_id text references public.admin_projects(id) on delete set null,
  supplier_id text references public.admin_suppliers(id) on delete set null,
  customer_id text references public.admin_customers(id) on delete set null,
  partner_name text not null default '',
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  notes text not null default '',
  steps jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_traitements_org_type
  on public.admin_traitements (organization_id, traitement_type, created_at desc);

create index if not exists idx_admin_traitements_project
  on public.admin_traitements (organization_id, project_id);

create table if not exists public.admin_traitement_lines (
  id text primary key,
  traitement_id text not null references public.admin_traitements(id) on delete cascade,
  stock_item_id text references public.admin_stock_items(id) on delete set null,
  reference text not null default '',
  designation text not null default '',
  unit text not null default 'PIECE',
  qty numeric not null default 0 check (qty >= 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  sort_order int not null default 0
);

create index if not exists idx_admin_traitement_lines_traitement
  on public.admin_traitement_lines (traitement_id, sort_order);

drop trigger if exists trg_admin_traitements_updated_at on public.admin_traitements;
create trigger trg_admin_traitements_updated_at
before update on public.admin_traitements
for each row execute function public.touch_updated_at();
