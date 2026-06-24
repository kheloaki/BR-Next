-- Per-depot stock balances + depot on traitements / transfers

create table if not exists public.admin_depot_stock (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  depot_id text not null references public.admin_depots(id) on delete cascade,
  stock_item_id text not null references public.admin_stock_items(id) on delete cascade,
  qty numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_depot_stock_unique unique (organization_id, depot_id, stock_item_id)
);

create index if not exists idx_admin_depot_stock_org_depot
  on public.admin_depot_stock (organization_id, depot_id);

create index if not exists idx_admin_depot_stock_item
  on public.admin_depot_stock (organization_id, stock_item_id);

drop trigger if exists trg_admin_depot_stock_updated_at on public.admin_depot_stock;
create trigger trg_admin_depot_stock_updated_at
before update on public.admin_depot_stock
for each row execute function public.touch_updated_at();

alter table public.admin_traitements
  add column if not exists depot_id text references public.admin_depots(id) on delete set null;

create index if not exists idx_admin_traitements_depot
  on public.admin_traitements (organization_id, depot_id);

alter table public.admin_stock_movements
  add column if not exists destination_depot_id text references public.admin_depots(id) on delete set null;

create index if not exists idx_admin_stock_movements_dest_depot
  on public.admin_stock_movements (organization_id, destination_depot_id);

alter table public.admin_purchase_requests
  add column if not exists depot_id text references public.admin_depots(id) on delete set null;
