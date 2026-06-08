-- BARANE INVEST — Finance roles (financier, accountant, project_manager)
-- Extends admin_organization_members role constraint.

alter table public.admin_organization_members
  drop constraint if exists admin_organization_members_role_check;

alter table public.admin_organization_members
  add constraint admin_organization_members_role_check
  check (role in ('owner', 'admin', 'member', 'financier', 'accountant', 'project_manager'));
