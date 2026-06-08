-- BARANE INVEST — Conducteur : CIN, poste, chantiers (multi)
-- Run after 27-supplier-rib.sql

alter table public.admin_gasoil_contacts
  add column if not exists cin text not null default '',
  add column if not exists job_title text not null default '',
  add column if not exists project_ids text[] not null default '{}';

create index if not exists idx_admin_gasoil_contacts_project_ids
  on public.admin_gasoil_contacts using gin (project_ids);
