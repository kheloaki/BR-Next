-- BARANE INVEST — Nom fournisseur + société (au moins l'un des deux)
-- Run after 23-supplier-supply-types.sql

alter table public.admin_suppliers
  add column if not exists supplier_name text not null default '',
  add column if not exists company_name text not null default '';

update public.admin_suppliers
set company_name = name
where company_name = '' and coalesce(name, '') <> '';

update public.admin_suppliers
set name = case
  when supplier_name <> '' and company_name <> '' then supplier_name || ' — ' || company_name
  when supplier_name <> '' then supplier_name
  else company_name
end
where supplier_name <> '' or company_name <> '';

alter table public.admin_suppliers
  drop constraint if exists admin_suppliers_name_parts_check;

alter table public.admin_suppliers
  add constraint admin_suppliers_name_parts_check
  check (
    length(trim(supplier_name)) > 0
    or length(trim(company_name)) > 0
    or length(trim(name)) > 0
  );
