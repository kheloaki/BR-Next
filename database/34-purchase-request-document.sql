-- DA as document + link to traitement achat after approval

alter table public.admin_purchase_requests
  add column if not exists reference text not null default '',
  add column if not exists designation text not null default '',
  add column if not exists unit text not null default 'PIECE',
  add column if not exists product_id text references public.admin_products(id) on delete set null,
  add column if not exists traitement_id text references public.admin_traitements(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text;

create index if not exists idx_admin_purchase_requests_traitement
  on public.admin_purchase_requests (organization_id, traitement_id)
  where traitement_id is not null;

alter table public.admin_traitements
  add column if not exists purchase_request_id text references public.admin_purchase_requests(id) on delete set null;

create index if not exists idx_admin_traitements_purchase_request
  on public.admin_traitements (organization_id, purchase_request_id)
  where purchase_request_id is not null;
