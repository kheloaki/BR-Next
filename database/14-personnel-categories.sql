-- BARANE INVEST — Postes / fonctions personnel (référentiel)
-- Run after 13-rental-material.sql

create table if not exists public.admin_personnel_categories (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  organization_id text references public.admin_organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_personnel_categories_org
  on public.admin_personnel_categories (organization_id);

create unique index if not exists idx_admin_personnel_categories_org_name
  on public.admin_personnel_categories (organization_id, lower(name));
