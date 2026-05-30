-- BARANE INVEST — Catalogue matériel location (séparé des bons location)
-- Run after 14-personnel-categories.sql

create table if not exists public.admin_rental_materials (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  organization_id text references public.admin_organizations(id) on delete cascade,
  material_category text not null default 'engin',
  reference text not null default '',
  matricule text not null default '',
  designation text not null,
  sub_category text not null default '',
  owner_name text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_rental_materials_category_check
    check (material_category in ('engin', 'camion', 'voiture', 'groupe_electrogen', 'other'))
);

create index if not exists idx_admin_rental_materials_org
  on public.admin_rental_materials (organization_id, material_category);

create unique index if not exists idx_admin_rental_materials_org_ref
  on public.admin_rental_materials (organization_id, lower(reference))
  where reference <> '';

alter table public.admin_rental_contracts
  add column if not exists material_id text references public.admin_rental_materials(id) on delete set null;

create index if not exists idx_admin_rental_contracts_material
  on public.admin_rental_contracts (organization_id, material_id)
  where material_id is not null;

drop trigger if exists trg_admin_rental_materials_updated_at on public.admin_rental_materials;
create trigger trg_admin_rental_materials_updated_at
before update on public.admin_rental_materials
for each row execute function public.touch_updated_at();
