-- BARANE INVEST — Référentiel conducteurs / pompistes (bons gasoil)
-- Run after 08-gasoil-bons.sql

create table if not exists public.admin_gasoil_contacts (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  organization_id text references public.admin_organizations(id) on delete cascade,
  role text not null,
  name text not null,
  created_at timestamptz not null default now(),
  constraint admin_gasoil_contacts_role_check
    check (role in ('conducteur', 'pompiste'))
);

create index if not exists idx_admin_gasoil_contacts_org_role
  on public.admin_gasoil_contacts (organization_id, role, name);

create unique index if not exists idx_admin_gasoil_contacts_org_role_name
  on public.admin_gasoil_contacts (organization_id, role, lower(name));

alter table public.admin_gasoil_bons
  add column if not exists driver_contact_id text references public.admin_gasoil_contacts(id) on delete set null,
  add column if not exists pompiste_contact_id text references public.admin_gasoil_contacts(id) on delete set null,
  add column if not exists fuel_time text not null default '';

create index if not exists idx_admin_gasoil_bons_driver_contact
  on public.admin_gasoil_bons (organization_id, driver_contact_id)
  where driver_contact_id is not null;

create index if not exists idx_admin_gasoil_bons_pompiste_contact
  on public.admin_gasoil_bons (organization_id, pompiste_contact_id)
  where pompiste_contact_id is not null;
