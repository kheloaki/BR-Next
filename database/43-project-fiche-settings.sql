-- Per-project fiche: which dashboard sections are visible (null = all)
alter table public.admin_projects
  add column if not exists fiche_visible_sections jsonb default null;
