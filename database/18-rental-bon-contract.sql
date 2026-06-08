-- BARANE INVEST — Bon location contrat (lignes journalières + gasoil)
-- Run after 17-material-detail-categories.sql

alter table public.admin_rental_contracts
  add column if not exists locataire text not null default 'BARANE INVEST',
  add column if not exists line_date date,
  add column if not exists gasoil numeric not null default 0,
  add column if not exists bon_lines jsonb not null default '[]'::jsonb;
