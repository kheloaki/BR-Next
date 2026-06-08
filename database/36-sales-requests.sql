-- Demandes de vente (DV) → traitement vente articles

create table if not exists public.admin_sales_requests (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  number text not null,
  subject text not null,
  reference text not null default '',
  designation text not null default '',
  unit text not null default 'PIECE',
  product_id text references public.admin_products(id) on delete set null,
  stock_item_id text references public.admin_stock_items(id) on delete set null,
  qty numeric not null default 0,
  unit_price numeric not null default 0,
  total_amount numeric not null default 0,
  customer_id text references public.admin_customers(id) on delete set null,
  customer text not null default '',
  delivery_date date,
  justification text not null default '',
  requester text not null default '',
  status text not null default 'pending',
  traitement_id text references public.admin_traitements(id) on delete set null,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_sales_requests_status_check
    check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists idx_admin_sales_requests_org
  on public.admin_sales_requests (organization_id, created_at desc);

create index if not exists idx_admin_sales_requests_status
  on public.admin_sales_requests (organization_id, status);

create index if not exists idx_admin_sales_requests_traitement
  on public.admin_sales_requests (organization_id, traitement_id)
  where traitement_id is not null;

alter table public.admin_traitements
  add column if not exists sales_request_id text references public.admin_sales_requests(id) on delete set null;

create index if not exists idx_admin_traitements_sales_request
  on public.admin_traitements (organization_id, sales_request_id)
  where sales_request_id is not null;

drop trigger if exists trg_admin_sales_requests_updated_at on public.admin_sales_requests;
create trigger trg_admin_sales_requests_updated_at
before update on public.admin_sales_requests
for each row execute function public.touch_updated_at();
