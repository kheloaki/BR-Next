-- BARANE INVEST — Multi-article lines on purchase requests (DA articles)

alter table public.admin_purchase_requests
  add column if not exists lines jsonb not null default '[]'::jsonb;

create index if not exists idx_admin_purchase_requests_lines
  on public.admin_purchase_requests using gin (lines)
  where jsonb_array_length(lines) > 0;
