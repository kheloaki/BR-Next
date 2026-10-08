-- BARANE INVEST — Multi-line items on bons gasoil (sortie)
-- Run after 50-employee-cin-fields.sql

alter table public.admin_gasoil_bons
  add column if not exists line_items jsonb not null default '[]'::jsonb;

comment on column public.admin_gasoil_bons.line_items is
  'Lignes détail (date, matériel, compteur, heure, litres). Agrégats litres/date restent sur les colonnes principales.';
