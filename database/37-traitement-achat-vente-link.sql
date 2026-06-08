-- Link achat traitement → vente traitement (same articles, continued workflow)

alter table public.admin_traitements
  add column if not exists source_traitement_id text references public.admin_traitements(id) on delete set null,
  add column if not exists vente_traitement_id text references public.admin_traitements(id) on delete set null;

create index if not exists idx_admin_traitements_source
  on public.admin_traitements (organization_id, source_traitement_id)
  where source_traitement_id is not null;

create index if not exists idx_admin_traitements_vente_child
  on public.admin_traitements (organization_id, vente_traitement_id)
  where vente_traitement_id is not null;
