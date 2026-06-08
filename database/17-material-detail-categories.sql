-- BARANE INVEST — Catégories détaillées matériel (pelle, 8x4, kVA…)
-- Run after 16-rental-material-fields.sql

create table if not exists public.admin_material_detail_categories (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  organization_id text references public.admin_organizations(id) on delete cascade,
  material_category text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint admin_material_detail_categories_material_category_check
    check (material_category in ('engin', 'camion', 'groupe_electrogen'))
);

create index if not exists idx_admin_material_detail_categories_org
  on public.admin_material_detail_categories (organization_id, material_category);

create unique index if not exists idx_admin_material_detail_categories_org_cat_name
  on public.admin_material_detail_categories (organization_id, material_category, lower(name));
