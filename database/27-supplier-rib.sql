-- BARANE INVEST — RIB fournisseur
-- Run after 26-rental-material-supplier-driver.sql

alter table public.admin_suppliers
  add column if not exists rib text not null default '';
