-- BARANE INVEST — DA Gasoil fields on purchase requests
-- Run on existing databases after 04-operations.sql

alter table public.admin_purchase_requests
  add column if not exists pump_meter numeric,
  add column if not exists stock_item_id text references public.admin_stock_items(id) on delete set null,
  add column if not exists stock_qty_snapshot numeric;

create index if not exists idx_admin_purchase_requests_category
  on public.admin_purchase_requests (user_id, category);
