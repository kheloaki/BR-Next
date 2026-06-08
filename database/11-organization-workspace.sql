-- BARANE INVEST — Shared workspace (multi-user admin panel)
-- Run on existing databases after foundation + commercial schemas.

create table if not exists public.admin_organizations (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  user_id text references public.admin_users(id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_admin_org_members_org_user
  on public.admin_organization_members (organization_id, user_id)
  where user_id is not null;

create unique index if not exists idx_admin_org_members_org_email
  on public.admin_organization_members (organization_id, lower(email))
  where email <> '';

insert into public.admin_organizations (id, name)
values ('barane-invest', 'BARANE INVEST')
on conflict (id) do nothing;

-- Link existing Clerk users to the shared workspace
insert into public.admin_organization_members (organization_id, user_id, email, display_name, role)
select
  'barane-invest',
  u.id,
  u.id,
  u.id,
  case when row_number() over (order by u.created_at) = 1 then 'owner' else 'member' end
from public.admin_users u
on conflict do nothing;

-- Add organization_id to all tenant-scoped tables
do $$
declare
  t text;
begin
  foreach t in array array[
    'admin_customers',
    'admin_product_categories',
    'admin_products',
    'admin_quotes',
    'admin_suppliers',
    'admin_projects',
    'admin_depots',
    'admin_equipment',
    'admin_employees',
    'admin_stock_items',
    'admin_stock_movements',
    'admin_purchase_requests',
    'admin_fuel_entries',
    'admin_gasoil_bons',
    'admin_gasoil_contacts',
    'admin_drilling_reports',
    'admin_trips',
    'admin_rental_contracts',
    'admin_attendance',
    'admin_production_entries',
    'admin_parts_usage'
  ]
  loop
    execute format(
      'alter table public.%I add column if not exists organization_id text references public.admin_organizations(id)',
      t
    );
    execute format(
      'update public.%I set organization_id = %L where organization_id is null',
      t,
      'barane-invest'
    );
    execute format(
      'create index if not exists idx_%I_organization_id on public.%I (organization_id)',
      t,
      t
    );
  end loop;
end $$;

-- Templates: one row per organization
alter table public.admin_templates
  add column if not exists organization_id text references public.admin_organizations(id);

update public.admin_templates
set organization_id = 'barane-invest'
where organization_id is null;

-- Templates: one row per organization (dedupe before unique index)
delete from public.admin_templates t
using public.admin_templates t2
where t.organization_id = 'barane-invest'
  and t2.organization_id = 'barane-invest'
  and t.user_id <> (
    select user_id from public.admin_templates
    where organization_id = 'barane-invest'
    order by updated_at desc nulls last
    limit 1
  );

create unique index if not exists idx_admin_templates_organization_id
  on public.admin_templates (organization_id);

alter table public.admin_templates
  alter column organization_id set not null;
