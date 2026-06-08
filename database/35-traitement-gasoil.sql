-- Gasoil supply chain via traitement achat (BC → réception gasoil → facture)

alter table public.admin_traitements
  add column if not exists supply_kind text not null default 'articles'
    check (supply_kind in ('articles', 'gasoil'));

create index if not exists idx_admin_traitements_supply_kind
  on public.admin_traitements (organization_id, supply_kind);

-- Link gasoil bons back to traitement (optional)
alter table public.admin_gasoil_bons
  add column if not exists traitement_id text references public.admin_traitements(id) on delete set null,
  add column if not exists purchase_request_id text references public.admin_purchase_requests(id) on delete set null;

create index if not exists idx_admin_gasoil_bons_traitement
  on public.admin_gasoil_bons (organization_id, traitement_id)
  where traitement_id is not null;
