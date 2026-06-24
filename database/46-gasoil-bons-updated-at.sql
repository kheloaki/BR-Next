-- BARANE INVEST — updated_at on admin_gasoil_bons (PATCH route + Supabase cache)

alter table public.admin_gasoil_bons
  add column if not exists updated_at timestamptz not null default now();

update public.admin_gasoil_bons
set updated_at = created_at;

drop trigger if exists trg_admin_gasoil_bons_updated_at on public.admin_gasoil_bons;
create trigger trg_admin_gasoil_bons_updated_at
before update on public.admin_gasoil_bons
for each row execute function public.touch_updated_at();
