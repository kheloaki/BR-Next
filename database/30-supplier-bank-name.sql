-- BARANE INVEST — Banque fournisseur + backfill organization_id
-- Run after 29-rental-bon-driver-contact.sql

alter table public.admin_suppliers
  add column if not exists bank_name text not null default '';

update public.admin_suppliers
set organization_id = coalesce(nullif(trim(organization_id), ''), 'barane-invest')
where organization_id is null or trim(organization_id) = '';
