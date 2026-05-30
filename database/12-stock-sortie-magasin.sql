-- BARANE INVEST — Sortie de magasin (register fields)
-- Run after 11-organization-workspace.sql

alter table public.admin_stock_items
  add column if not exists unit text not null default 'PIECE',
  add column if not exists article_code text not null default '';

alter table public.admin_stock_movements
  add column if not exists unit text not null default 'PIECE',
  add column if not exists article_code text not null default '',
  add column if not exists assignment text not null default '',
  add column if not exists exit_voucher_no text not null default '',
  add column if not exists requester text not null default '',
  add column if not exists storekeeper text not null default '',
  add column if not exists stock_after numeric not null default 0;

create index if not exists idx_admin_stock_movements_exit_voucher
  on public.admin_stock_movements (organization_id, exit_voucher_no)
  where exit_voucher_no <> '';
