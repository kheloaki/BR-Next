-- BARANE INVEST — Mode de location sur catalogue matériel
-- Run after 19-gasoil-contacts.sql

alter table public.admin_rental_materials
  add column if not exists rental_mode text not null default 'jour',
  add column if not exists contract_start_date date,
  add column if not exists contract_end_date date,
  add column if not exists contract_open_ended boolean not null default false,
  add column if not exists monthly_price_ht numeric not null default 0,
  add column if not exists forfait_price_ht numeric not null default 0,
  add column if not exists vat_rate numeric not null default 20;

alter table public.admin_rental_materials
  drop constraint if exists admin_rental_materials_rental_mode_check;
alter table public.admin_rental_materials
  add constraint admin_rental_materials_rental_mode_check
    check (rental_mode in ('jour', 'mois', 'forfait'));
