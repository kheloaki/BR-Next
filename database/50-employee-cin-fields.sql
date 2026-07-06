-- Personnel: matricule → N° CIN, adresse, date de naissance

alter table public.admin_employees
  add column if not exists address text not null default '',
  add column if not exists birth_date date;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_employees' and column_name = 'matricule'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_employees' and column_name = 'cin'
  ) then
    alter table public.admin_employees rename column matricule to cin;
  end if;
end $$;

alter table public.admin_employees
  add column if not exists cin text not null default '';
