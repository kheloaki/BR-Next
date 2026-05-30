-- BARANE INVEST — Foundation (run first)
-- Tenant root + shared triggers

create table if not exists public.admin_users (
  id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_customers (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  name text not null,
  ice text not null default '',
  city text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_customers_user_id
  on public.admin_customers (user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_customers_updated_at on public.admin_customers;
create trigger trg_admin_customers_updated_at
before update on public.admin_customers
for each row execute function public.touch_updated_at();
