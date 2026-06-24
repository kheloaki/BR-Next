-- Gasoil quantities are in litres (L), not pieces.

update public.admin_stock_items
set unit = 'L'
where category in ('gasoil', 'fuel')
   or lower(coalesce(reference, '')) like '%gasoil%'
   or lower(coalesce(designation, '')) like '%gasoil%'
   or lower(coalesce(designation, '')) like '%diesel%'
   or lower(coalesce(designation, '')) like '%carburant%';

update public.admin_purchase_requests
set unit = 'L'
where number like 'DA-GASOIL-%'
  and coalesce(unit, 'PIECE') in ('PIECE', '');

update public.admin_traitement_lines tl
set unit = 'L'
from public.admin_traitements t
where tl.traitement_id = t.id
  and t.supply_kind = 'gasoil'
  and coalesce(tl.unit, 'PIECE') in ('PIECE', '');

update public.admin_stock_movements m
set unit = 'L'
from public.admin_stock_items i
where m.item_id = i.id
  and i.category in ('gasoil', 'fuel')
  and coalesce(m.unit, 'PIECE') in ('PIECE', '');
