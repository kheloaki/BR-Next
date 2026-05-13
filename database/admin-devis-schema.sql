create table if not exists public.admin_products (
  id text primary key,
  user_id text not null,
  reference text not null default 'NN',
  designation text not null,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_products_user_id
  on public.admin_products (user_id);

create table if not exists public.admin_quotes (
  id text primary key,
  user_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_quotes_user_id_created_at
  on public.admin_quotes (user_id, created_at desc);

create table if not exists public.admin_templates (
  user_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_products_updated_at on public.admin_products;
create trigger trg_admin_products_updated_at
before update on public.admin_products
for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_templates_updated_at on public.admin_templates;
create trigger trg_admin_templates_updated_at
before update on public.admin_templates
for each row execute function public.touch_updated_at();

create table if not exists public.admin_suppliers (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  name text not null,
  ice text not null default '',
  city text not null default '',
  address text not null default '',
  contact text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_suppliers_user_id
  on public.admin_suppliers (user_id);

drop trigger if exists trg_admin_suppliers_updated_at on public.admin_suppliers;
create trigger trg_admin_suppliers_updated_at
before update on public.admin_suppliers
for each row execute function public.touch_updated_at();
