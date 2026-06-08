-- BARANE INVEST — Colonnes manquantes sur admin_gasoil_bons (legacy fuel_entries link)
-- Run after 19-gasoil-contacts.sql (or anytime if insert fails on fuel_entry_id / material_id)

alter table public.admin_gasoil_bons
  add column if not exists material_id text references public.admin_rental_materials(id) on delete set null;

alter table public.admin_gasoil_bons
  add column if not exists fuel_entry_id text references public.admin_fuel_entries(id) on delete set null;

create index if not exists idx_admin_gasoil_bons_material
  on public.admin_gasoil_bons (organization_id, material_id)
  where material_id is not null;
