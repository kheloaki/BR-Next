-- BARANE INVEST — TVA par défaut 10 %
-- Run after 20-rental-material-location-mode.sql

alter table public.admin_rental_materials
  alter column vat_rate set default 10;
