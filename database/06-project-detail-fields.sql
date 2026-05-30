-- BARANE INVEST — Extended project (chantier) fields
-- Run on existing databases after 02-master-data.sql

alter table public.admin_projects
  add column if not exists address text not null default '',
  add column if not exists market_number text not null default '',
  add column if not exists market_description text not null default '',
  add column if not exists chantier_document_url text not null default '',
  add column if not exists plan_url text not null default '';
