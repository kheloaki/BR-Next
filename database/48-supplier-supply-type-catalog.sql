-- BARANE INVEST — Catalogue types d'approvisionnement fournisseur (personnalisés)
-- Run after 47-purchase-request-lines.sql

create table if not exists public.admin_supplier_supply_types (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  slug text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_supplier_supply_types_org
  on public.admin_supplier_supply_types (organization_id);

create unique index if not exists idx_admin_supplier_supply_types_org_slug
  on public.admin_supplier_supply_types (organization_id, lower(slug));

create unique index if not exists idx_admin_supplier_supply_types_org_label
  on public.admin_supplier_supply_types (organization_id, lower(label));
