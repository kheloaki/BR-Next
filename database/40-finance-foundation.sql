-- BARANE INVEST — Finance foundation (accounts, categories, movements, allocations, documents, closings)
-- Run after patch 39.

-- ─── Accounts (caisse + banque) ───────────────────────────────────────────────
create table if not exists public.admin_finance_accounts (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  user_id text not null references public.admin_users(id) on delete cascade,
  name text not null,
  code text not null default '',
  account_type text not null check (account_type in ('cash', 'bank')),
  currency text not null default 'MAD',
  opening_balance numeric(14, 2) not null default 0,
  is_active boolean not null default true,
  is_default boolean not null default false,
  bank_name text,
  rib text,
  iban text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_finance_accounts_org on public.admin_finance_accounts (organization_id);
create index if not exists idx_finance_accounts_type on public.admin_finance_accounts (organization_id, account_type);

-- ─── Categories ───────────────────────────────────────────────────────────────
create table if not exists public.admin_finance_categories (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  direction text not null default 'both' check (direction in ('income', 'expense', 'both')),
  is_system boolean not null default false,
  parent_id text references public.admin_finance_categories(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_finance_categories_org_slug
  on public.admin_finance_categories (organization_id, slug);

-- ─── Movements (central journal) ──────────────────────────────────────────────
create table if not exists public.admin_finance_movements (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  account_id text not null references public.admin_finance_accounts(id) on delete restrict,
  category_id text not null references public.admin_finance_categories(id) on delete restrict,
  movement_type text not null check (movement_type in ('income', 'expense', 'transfer_in', 'transfer_out', 'adjustment')),
  amount numeric(14, 2) not null check (amount > 0),
  movement_date date not null,
  reference text not null,
  payment_method text check (payment_method is null or payment_method in ('cash', 'bank', 'cheque', 'transfer', 'effect')),
  project_id text references public.admin_projects(id) on delete set null,
  customer_id text references public.admin_customers(id) on delete set null,
  supplier_id text references public.admin_suppliers(id) on delete set null,
  cheque_number text,
  virement_ref text,
  effect_ref text,
  transfer_group_id uuid,
  created_by text not null references public.admin_users(id) on delete restrict,
  notes text,
  receipt_url text,
  amount_ht numeric(14, 2),
  vat_amount numeric(14, 2),
  is_reconciled boolean not null default false,
  reconciled_at timestamptz,
  voided_at timestamptz,
  voided_by text references public.admin_users(id) on delete set null,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_finance_movements_org on public.admin_finance_movements (organization_id);
create index if not exists idx_finance_movements_account on public.admin_finance_movements (account_id, movement_date desc);
create index if not exists idx_finance_movements_project on public.admin_finance_movements (project_id) where project_id is not null;
create index if not exists idx_finance_movements_customer on public.admin_finance_movements (customer_id) where customer_id is not null;
create index if not exists idx_finance_movements_supplier on public.admin_finance_movements (supplier_id) where supplier_id is not null;
create unique index if not exists idx_finance_movements_org_ref
  on public.admin_finance_movements (organization_id, reference)
  where voided_at is null;

-- ─── Finance documents (AR/AP) ────────────────────────────────────────────────
create table if not exists public.admin_finance_documents (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  user_id text not null references public.admin_users(id) on delete cascade,
  document_type text not null check (document_type in ('client_invoice', 'supplier_invoice', 'client_credit', 'supplier_credit')),
  document_number text not null default '',
  source_type text,
  source_id text,
  customer_id text references public.admin_customers(id) on delete set null,
  supplier_id text references public.admin_suppliers(id) on delete set null,
  project_id text references public.admin_projects(id) on delete set null,
  issue_date date not null,
  due_date date,
  amount_ht numeric(14, 2) not null default 0,
  amount_ttc numeric(14, 2) not null default 0,
  currency text not null default 'MAD',
  paid_amount numeric(14, 2) not null default 0,
  remaining_amount numeric(14, 2) not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'partial', 'paid', 'overdue')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_finance_documents_org on public.admin_finance_documents (organization_id);
create index if not exists idx_finance_documents_customer on public.admin_finance_documents (customer_id) where customer_id is not null;
create index if not exists idx_finance_documents_supplier on public.admin_finance_documents (supplier_id) where supplier_id is not null;
create index if not exists idx_finance_documents_status on public.admin_finance_documents (organization_id, payment_status);

-- ─── Payment allocations ──────────────────────────────────────────────────────
create table if not exists public.admin_finance_payment_allocations (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  movement_id text not null references public.admin_finance_movements(id) on delete cascade,
  target_type text not null check (target_type in ('quote', 'traitement', 'purchase_request', 'finance_document', 'expense', 'manual')),
  target_id text not null,
  allocated_amount numeric(14, 2) not null check (allocated_amount > 0),
  allocated_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_finance_allocations_movement on public.admin_finance_payment_allocations (movement_id);
create index if not exists idx_finance_allocations_target on public.admin_finance_payment_allocations (target_type, target_id);

-- ─── Caisse closings ──────────────────────────────────────────────────────────
create table if not exists public.admin_finance_caisse_closings (
  id text primary key,
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  account_id text not null references public.admin_finance_accounts(id) on delete restrict,
  closing_date date not null,
  opening_balance numeric(14, 2) not null default 0,
  total_income numeric(14, 2) not null default 0,
  total_expense numeric(14, 2) not null default 0,
  theoretical_balance numeric(14, 2) not null default 0,
  counted_balance numeric(14, 2) not null default 0,
  difference numeric(14, 2) not null default 0,
  closed_by text not null references public.admin_users(id) on delete restrict,
  signed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_finance_closings_account_date
  on public.admin_finance_caisse_closings (account_id, closing_date);

-- ─── Project access for project_manager (Phase 9) ─────────────────────────────
create table if not exists public.admin_member_project_access (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.admin_organizations(id) on delete cascade,
  member_id uuid not null references public.admin_organization_members(id) on delete cascade,
  project_id text not null references public.admin_projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_id, project_id)
);

create index if not exists idx_member_project_access_member on public.admin_member_project_access (member_id);

-- ─── Seed system categories per org ───────────────────────────────────────────
insert into public.admin_finance_categories (id, organization_id, name, slug, direction, is_system)
select
  'fcat-' || o.id || '-' || c.slug,
  o.id,
  c.name,
  c.slug,
  c.direction,
  true
from public.admin_organizations o
cross join (
  values
    ('client_payment', 'Encaissement client', 'income'),
    ('supplier_payment', 'Paiement fournisseur', 'expense'),
    ('gasoil', 'Gasoil', 'expense'),
    ('achat_pieces', 'Achat pièces', 'expense'),
    ('location_materiel', 'Location matériel', 'expense'),
    ('salaire', 'Salaire', 'expense'),
    ('transport', 'Transport', 'expense'),
    ('avance', 'Avance', 'both'),
    ('bank_fee', 'Frais bancaires', 'expense'),
    ('maintenance', 'Maintenance', 'expense'),
    ('sous_traitance', 'Sous-traitance', 'expense'),
    ('frais_chantier', 'Frais chantier', 'expense'),
    ('administration', 'Administration', 'expense'),
    ('taxes', 'Taxes', 'expense'),
    ('divers', 'Divers', 'both')
) as c(slug, name, direction)
on conflict do nothing;
