-- BARANE INVEST — Quote document type (devis / bon_commande / facture)
-- Run on existing databases after 01-commercial.sql
--
-- Full quote body (lines, dueDate, client, etc.) stays in payload jsonb.
-- This column only speeds up filtering and dashboard counts.

alter table public.admin_quotes
  add column if not exists document_type text generated always as (
    case coalesce(nullif(trim(payload->>'documentType'), ''), 'devis')
      when 'bon_commande' then 'bon_commande'
      when 'facture' then 'facture'
      else 'devis'
    end
  ) stored;

create index if not exists idx_admin_quotes_user_document_type
  on public.admin_quotes (user_id, document_type, created_at desc);
