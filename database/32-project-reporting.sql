-- Project reporting: link quotes to chantiers + gasoil amounts for rentabilité

alter table admin_quotes
  add column if not exists project_id text references admin_projects(id) on delete set null;

update admin_quotes q
set project_id = nullif(trim(q.payload->>'projectId'), '')
where q.project_id is null
  and coalesce(nullif(trim(q.payload->>'projectId'), ''), '') <> '';

create index if not exists admin_quotes_org_project_doc_idx
  on admin_quotes (organization_id, project_id, document_type);

alter table admin_gasoil_bons
  add column if not exists unit_price numeric(12, 4) default 0,
  add column if not exists total_amount numeric(14, 2) default 0;

update admin_gasoil_bons
set total_amount = round((litres * coalesce(nullif(unit_price, 0), 0))::numeric, 2)
where total_amount = 0 and unit_price > 0 and litres > 0;
