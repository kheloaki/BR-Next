-- Add unité (unit) on catalog products — run after 01-commercial.sql

alter table public.admin_products
  add column if not exists unit text not null default 'u';
