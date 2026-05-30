-- BARANE INVEST — Add bon_livraison to generated document_type on admin_quotes
-- Run on existing databases after 09-commercial-quote-document-type.sql

alter table public.admin_quotes drop column if exists document_type;

alter table public.admin_quotes
  add column document_type text generated always as (
    case coalesce(nullif(trim(payload->>'documentType'), ''), 'devis')
      when 'bon_commande' then 'bon_commande'
      when 'facture' then 'facture'
      when 'bon_livraison' then 'bon_livraison'
      else 'devis'
    end
  ) stored;

create index if not exists idx_admin_quotes_user_document_type
  on public.admin_quotes (user_id, document_type, created_at desc);
