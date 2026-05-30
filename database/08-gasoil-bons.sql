-- BARANE INVEST — Bons gasoil (achat / sortie)
-- Run on existing databases after 07-fuel-da-fields.sql

create table if not exists public.admin_gasoil_bons (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  number text not null,
  bon_type text not null,
  vehicle_category text not null,
  project_id text references public.admin_projects(id) on delete set null,
  equipment_id text references public.admin_equipment(id) on delete set null,
  vehicle_label text not null default '',
  equipment_name text not null default '',
  site_name text not null default '',
  bon_date date not null default current_date,
  litres numeric not null default 0,
  pump_meter numeric,
  supplier text not null default '',
  beneficiary text not null default '',
  delivery_note text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint admin_gasoil_bons_type_check
    check (bon_type in ('achat', 'sortie')),
  constraint admin_gasoil_bons_vehicle_check
    check (vehicle_category in ('engin', 'camion', 'voiture', 'groupe_electrogene'))
);

create index if not exists idx_admin_gasoil_bons_user_id
  on public.admin_gasoil_bons (user_id, bon_date desc);

create index if not exists idx_admin_gasoil_bons_type
  on public.admin_gasoil_bons (user_id, bon_type, bon_date desc);

create index if not exists idx_admin_gasoil_bons_category
  on public.admin_gasoil_bons (user_id, vehicle_category);

create index if not exists idx_admin_gasoil_bons_project
  on public.admin_gasoil_bons (user_id, project_id);
