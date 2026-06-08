-- BARANE INVEST — Fournisseur + conducteur (FK) sur catalogue matériel
-- Run after 25-rental-material-columns-vat-20.sql

alter table public.admin_rental_materials
  add column if not exists supplier_id text references public.admin_suppliers(id) on delete set null,
  add column if not exists driver_contact_id text references public.admin_gasoil_contacts(id) on delete set null;

create index if not exists idx_admin_rental_materials_supplier
  on public.admin_rental_materials (organization_id, supplier_id)
  where supplier_id is not null;

create index if not exists idx_admin_rental_materials_driver_contact
  on public.admin_rental_materials (organization_id, driver_contact_id)
  where driver_contact_id is not null;
