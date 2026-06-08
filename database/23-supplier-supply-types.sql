-- BARANE INVEST — Types d'approvisionnement fournisseur (multi)
-- Run after 22-gasoil-bons-extra-columns.sql

alter table public.admin_suppliers
  add column if not exists supply_types text[] not null default '{}';

create index if not exists idx_admin_suppliers_supply_types
  on public.admin_suppliers using gin (supply_types);
