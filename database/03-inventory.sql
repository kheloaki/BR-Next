-- BARANE INVEST — Inventory (run after 02-master-data.sql)
-- Stock items + movements (depot_id + optional project_id)

create table if not exists public.admin_stock_items (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  reference text not null default '',
  designation text not null,
  category text not null default '',
  qty numeric not null default 0,
  min_qty numeric not null default 0,
  unit_price numeric not null default 0,
  default_depot_id text references public.admin_depots(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_stock_items_user_id
  on public.admin_stock_items (user_id);

create index if not exists idx_admin_stock_items_depot
  on public.admin_stock_items (user_id, default_depot_id);

create table if not exists public.admin_stock_movements (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  item_id text references public.admin_stock_items(id) on delete set null,
  depot_id text references public.admin_depots(id) on delete set null,
  project_id text references public.admin_projects(id) on delete set null,
  movement_type text not null,
  movement_date date not null default current_date,
  reference text not null default '',
  designation text not null default '',
  category text not null default '',
  qty numeric not null default 0,
  unit_price numeric not null default 0,
  supplier text not null default '',
  delivery_note text not null default '',
  site_name text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint admin_stock_movements_type_check
    check (movement_type in ('entry', 'exit', 'return', 'transfer'))
);

create index if not exists idx_admin_stock_movements_user_id
  on public.admin_stock_movements (user_id, created_at desc);

create index if not exists idx_admin_stock_movements_depot
  on public.admin_stock_movements (user_id, depot_id);

create index if not exists idx_admin_stock_movements_project
  on public.admin_stock_movements (user_id, project_id);

drop trigger if exists trg_admin_stock_items_updated_at on public.admin_stock_items;
create trigger trg_admin_stock_items_updated_at
before update on public.admin_stock_items
for each row execute function public.touch_updated_at();
