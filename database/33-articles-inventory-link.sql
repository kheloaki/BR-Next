-- BARANE INVEST — Articles (admin_products) ↔ Inventaire (admin_stock_items)
-- One article master; inventory holds qty/min_qty per article.

alter table public.admin_stock_items
  add column if not exists product_id text references public.admin_products(id) on delete cascade;

alter table public.admin_traitement_lines
  add column if not exists product_id text references public.admin_products(id) on delete set null;

create unique index if not exists idx_admin_stock_items_org_product
  on public.admin_stock_items (organization_id, product_id)
  where product_id is not null;

create index if not exists idx_admin_stock_items_product
  on public.admin_stock_items (product_id);

create index if not exists idx_admin_traitement_lines_product
  on public.admin_traitement_lines (product_id);

-- Link existing stock rows to matching products (reference or designation)
update public.admin_stock_items s
set product_id = p.id
from public.admin_products p
where s.product_id is null
  and s.organization_id = p.organization_id
  and (
    (nullif(trim(s.reference), '') is not null and lower(trim(p.reference)) = lower(trim(s.reference)))
    or lower(trim(p.designation)) = lower(trim(s.designation))
  );

-- Create products for orphan stock rows (non-gasoil)
insert into public.admin_products (id, user_id, organization_id, reference, designation, category, unit, unit_price)
select
  'prod-' || substr(replace(s.id, '-', ''), 1, 20),
  s.user_id,
  s.organization_id,
  coalesce(nullif(trim(s.reference), ''), 'NN'),
  s.designation,
  coalesce(s.category, ''),
  coalesce(nullif(trim(s.unit), ''), 'PIECE'),
  coalesce(s.unit_price, 0)
from public.admin_stock_items s
where s.product_id is null
  and not (
    lower(coalesce(s.category, '')) like '%gasoil%'
    or lower(coalesce(s.designation, '')) like '%gasoil%'
    or lower(coalesce(s.reference, '')) like '%gasoil%'
  )
on conflict (id) do nothing;

update public.admin_stock_items s
set product_id = p.id
from public.admin_products p
where s.product_id is null
  and s.organization_id = p.organization_id
  and p.id = 'prod-' || substr(replace(s.id, '-', ''), 1, 20);

-- Inventory rows for products without stock yet
insert into public.admin_stock_items (
  id, user_id, organization_id, product_id,
  reference, designation, category, unit, article_code,
  qty, min_qty, unit_price
)
select
  'stk-' || substr(replace(p.id, '-', ''), 1, 20),
  p.user_id,
  p.organization_id,
  p.id,
  coalesce(nullif(trim(p.reference), ''), ''),
  p.designation,
  coalesce(p.category, ''),
  coalesce(nullif(trim(p.unit), ''), 'PIECE'),
  '',
  0,
  0,
  coalesce(p.unit_price, 0)
from public.admin_products p
where not exists (
  select 1 from public.admin_stock_items s where s.product_id = p.id
)
on conflict (id) do nothing;

-- Backfill traitement lines product_id from stock_item
update public.admin_traitement_lines l
set product_id = s.product_id
from public.admin_stock_items s
where l.product_id is null
  and l.stock_item_id = s.id
  and s.product_id is not null;
