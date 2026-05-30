-- BARANE INVEST — Operations (run after 03-inventory.sql)
-- All transactional modules link to admin_projects via project_id

create table if not exists public.admin_purchase_requests (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  number text not null,
  category text not null default 'misc',
  subject text not null,
  qty numeric not null default 0,
  unit_price numeric not null default 0,
  total_amount numeric not null default 0,
  supplier text not null default '',
  urgency text not null default 'Normale',
  delivery_date date,
  pump_meter numeric,
  stock_item_id text references public.admin_stock_items(id) on delete set null,
  stock_qty_snapshot numeric,
  justification text not null default '',
  requester text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_purchase_requests_status_check
    check (status in ('pending', 'approved', 'rejected'))
);

create index if not exists idx_admin_purchase_requests_user_id
  on public.admin_purchase_requests (user_id, created_at desc);

create index if not exists idx_admin_purchase_requests_project
  on public.admin_purchase_requests (user_id, project_id);

create index if not exists idx_admin_purchase_requests_status
  on public.admin_purchase_requests (user_id, status);

create table if not exists public.admin_fuel_entries (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  equipment_id text references public.admin_equipment(id) on delete set null,
  equipment_name text not null default '',
  entry_date date not null default current_date,
  litres numeric not null default 0,
  meter_start numeric,
  meter_end numeric,
  site_name text not null default '',
  fueled_by text not null default '',
  ticket_no text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_fuel_entries_user_id
  on public.admin_fuel_entries (user_id, entry_date desc);

create index if not exists idx_admin_fuel_project
  on public.admin_fuel_entries (user_id, project_id, entry_date desc);

create table if not exists public.admin_gasoil_bons (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  number text not null,
  bon_type text not null,
  vehicle_category text not null,
  project_id text references public.admin_projects(id) on delete set null,
  equipment_id text references public.admin_equipment(id) on delete set null,
  vehicle_label text not null default '',
  equipment_name text not null default '',
  site_name text not null default '',
  bon_date date not null default current_date,
  litres numeric not null default 0,
  pump_meter numeric,
  supplier text not null default '',
  beneficiary text not null default '',
  delivery_note text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint admin_gasoil_bons_type_check
    check (bon_type in ('achat', 'sortie')),
  constraint admin_gasoil_bons_vehicle_check
    check (vehicle_category in ('engin', 'camion', 'voiture', 'groupe_electrogene'))
);

create index if not exists idx_admin_gasoil_bons_user_id
  on public.admin_gasoil_bons (user_id, bon_date desc);

create index if not exists idx_admin_gasoil_bons_type
  on public.admin_gasoil_bons (user_id, bon_type, bon_date desc);

create index if not exists idx_admin_gasoil_bons_category
  on public.admin_gasoil_bons (user_id, vehicle_category);

create index if not exists idx_admin_gasoil_bons_project
  on public.admin_gasoil_bons (user_id, project_id);

create table if not exists public.admin_drilling_reports (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  report_date date not null default current_date,
  site_name text not null default '',
  rig_name text not null default '',
  operator_name text not null default '',
  depth_start numeric not null default 0,
  depth_end numeric not null default 0,
  target_meters numeric not null default 60,
  run_hours numeric not null default 0,
  stop_hours numeric not null default 0,
  diameter_mm numeric,
  incidents text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_drilling_reports_user_id
  on public.admin_drilling_reports (user_id, report_date desc);

create index if not exists idx_admin_drilling_project
  on public.admin_drilling_reports (user_id, project_id, report_date desc);

create table if not exists public.admin_trips (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  trip_date date not null default current_date,
  vehicle_code text not null default '',
  plate text not null default '',
  driver_name text not null default '',
  departure text not null default '',
  destination text not null default '',
  load_type text not null default '',
  distance_km numeric not null default 0,
  delivery_note text not null default '',
  status text not null default 'delivered',
  created_at timestamptz not null default now(),
  constraint admin_trips_status_check
    check (status in ('delivered', 'in_transit', 'arrived'))
);

create index if not exists idx_admin_trips_user_id
  on public.admin_trips (user_id, trip_date desc);

create index if not exists idx_admin_trips_project
  on public.admin_trips (user_id, project_id, trip_date desc);

create table if not exists public.admin_rental_contracts (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  equipment_name text not null,
  owner_name text not null default '',
  contract_no text not null default '',
  hourly_rate numeric not null default 0,
  hours_worked numeric not null default 0,
  hours_stopped numeric not null default 0,
  hours_down numeric not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_rental_contracts_status_check
    check (status in ('active', 'maintenance', 'down'))
);

create index if not exists idx_admin_rental_contracts_user_id
  on public.admin_rental_contracts (user_id);

create index if not exists idx_admin_rental_project
  on public.admin_rental_contracts (user_id, project_id);

create table if not exists public.admin_attendance (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  employee_id text references public.admin_employees(id) on delete set null,
  employee_name text not null default '',
  matricule text not null default '',
  role text not null default '',
  record_date date not null default current_date,
  time_in text not null default '',
  time_out text not null default '',
  status text not null default 'present',
  overtime_hours numeric not null default 0,
  site_name text not null default '',
  task text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint admin_attendance_status_check
    check (status in ('present', 'sick', 'unexcused', 'leave', 'mission', 'training'))
);

create index if not exists idx_admin_attendance_user_id
  on public.admin_attendance (user_id, record_date desc);

create index if not exists idx_admin_attendance_project
  on public.admin_attendance (user_id, project_id, record_date desc);

create table if not exists public.admin_production_entries (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  entry_date date not null default current_date,
  site_name text not null default '',
  tonnage numeric not null default 0,
  target_tonnage numeric not null default 0,
  material text not null default '',
  run_hours numeric not null default 0,
  stop_hours numeric not null default 0,
  stop_reason text not null default '',
  shipped_tonnage numeric not null default 0,
  stock_tonnage numeric not null default 0,
  shift_lead text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_production_entries_user_id
  on public.admin_production_entries (user_id, entry_date desc);

create index if not exists idx_admin_production_project
  on public.admin_production_entries (user_id, project_id, entry_date desc);

create table if not exists public.admin_parts_usage (
  id text primary key,
  user_id text not null references public.admin_users(id) on delete cascade,
  project_id text references public.admin_projects(id) on delete set null,
  equipment_id text references public.admin_equipment(id) on delete set null,
  equipment_name text not null default '',
  stock_item_id text references public.admin_stock_items(id) on delete set null,
  reference text not null default '',
  designation text not null default '',
  usage_type text not null default 'part',
  qty numeric not null default 0,
  unit_price numeric not null default 0,
  usage_date date not null default current_date,
  created_at timestamptz not null default now(),
  constraint admin_parts_usage_type_check
    check (usage_type in ('part', 'lubricant'))
);

create index if not exists idx_admin_parts_usage_user_id
  on public.admin_parts_usage (user_id, usage_date desc);

create index if not exists idx_admin_parts_project
  on public.admin_parts_usage (user_id, project_id, usage_date desc);

drop trigger if exists trg_admin_purchase_requests_updated_at on public.admin_purchase_requests;
create trigger trg_admin_purchase_requests_updated_at
before update on public.admin_purchase_requests
for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_rental_contracts_updated_at on public.admin_rental_contracts;
create trigger trg_admin_rental_contracts_updated_at
before update on public.admin_rental_contracts
for each row execute function public.touch_updated_at();
