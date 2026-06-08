-- BARANE INVEST — Conducteur FK sur bons location
-- Run after 28-gasoil-contact-details.sql

alter table public.admin_rental_contracts
  add column if not exists driver_contact_id text references public.admin_gasoil_contacts(id) on delete set null;

create index if not exists idx_admin_rental_contracts_driver_contact
  on public.admin_rental_contracts (organization_id, driver_contact_id)
  where driver_contact_id is not null;
