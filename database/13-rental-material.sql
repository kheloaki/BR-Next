-- BARANE INVEST — Location matériel (5 catégories)
-- Run after 12-stock-sortie-magasin.sql

alter table public.admin_rental_contracts
  add column if not exists material_category text not null default 'engin',
  add column if not exists reference text not null default '',
  add column if not exists matricule text not null default '',
  add column if not exists designation text not null default '',
  add column if not exists sub_category text not null default '',
  add column if not exists employee_id text references public.admin_employees(id) on delete set null,
  add column if not exists driver_name text not null default '',
  add column if not exists daily_rate numeric not null default 0,
  add column if not exists days_count numeric not null default 0,
  add column if not exists transport_mode text not null default '',
  add column if not exists transport_price numeric not null default 0;

alter table public.admin_rental_contracts
  drop constraint if exists admin_rental_contracts_material_category_check;
alter table public.admin_rental_contracts
  add constraint admin_rental_contracts_material_category_check
    check (material_category in ('engin', 'camion', 'voiture', 'groupe_electrogen', 'other'));

alter table public.admin_rental_contracts
  drop constraint if exists admin_rental_contracts_transport_mode_check;
alter table public.admin_rental_contracts
  add constraint admin_rental_contracts_transport_mode_check
    check (transport_mode in ('', 'rendre', 'depart'));

update public.admin_rental_contracts
set designation = equipment_name
where designation = '' and coalesce(equipment_name, '') <> '';

create index if not exists idx_admin_rental_material_category
  on public.admin_rental_contracts (organization_id, material_category)
  where material_category <> '';
