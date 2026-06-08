-- BARANE INVEST — Champs location sur catalogue matériel
-- Run after 15-rental-materials-catalog.sql

alter table public.admin_rental_materials
  add column if not exists project_id text references public.admin_projects(id) on delete set null,
  add column if not exists employee_id text references public.admin_employees(id) on delete set null,
  add column if not exists driver_name text not null default '',
  add column if not exists daily_rate numeric not null default 0,
  add column if not exists days_count numeric not null default 0,
  add column if not exists transport_mode text not null default '',
  add column if not exists transport_price numeric not null default 0;

alter table public.admin_rental_materials
  drop constraint if exists admin_rental_materials_transport_mode_check;
alter table public.admin_rental_materials
  add constraint admin_rental_materials_transport_mode_check
    check (transport_mode in ('', 'rendre', 'depart'));

create index if not exists idx_admin_rental_materials_project
  on public.admin_rental_materials (organization_id, project_id)
  where project_id is not null;
