-- Project status: active / inactive only
update public.admin_projects
set status = 'inactive'
where status in ('draft', 'suspended', 'closed');

alter table public.admin_projects
  drop constraint if exists admin_projects_status_check;

alter table public.admin_projects
  add constraint admin_projects_status_check
  check (status in ('active', 'inactive'));
