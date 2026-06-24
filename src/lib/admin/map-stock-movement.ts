import type { StockMovementType } from "@/components/admin/operations-types";
import { isGasoilStockItem, GASOIL_UNIT } from "@/lib/admin/gasoil-stock";
import { nextExitVoucherNumber } from "@/lib/admin/exit-voucher-number";
import { parseStockTraitementLink } from "@/lib/admin/stock-traitement-link";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export function mapStockMovementRow(r: Record<string, unknown>) {
  const qty = Number(r.qty ?? 0);
  const unitPrice = Number(r.unit_price ?? 0);
  return {
    id: r.id as string,
    itemId: r.item_id as string,
    movementType: r.movement_type as StockMovementType,
    movementDate: r.movement_date as string,
    reference: r.reference as string,
    designation: r.designation as string,
    category: r.category as string,
    articleCode: (r.article_code as string) || "",
    unit:
      (r.unit as string) ||
      (isGasoilStockItem({
        category: r.category as string,
        reference: r.reference as string,
        designation: r.designation as string,
      })
        ? GASOIL_UNIT
        : "PIECE"),
    qty,
    unitPrice,
    totalPriceHt: qty * unitPrice,
    stockAfter: Number(r.stock_after ?? 0),
    assignment: (r.assignment as string) || (r.site_name as string) || "",
    exitVoucherNo: (r.exit_voucher_no as string) || "",
    requester: (r.requester as string) || "",
    storekeeper: (r.storekeeper as string) || "",
    supplier: (r.supplier as string) || "",
    deliveryNote: (r.delivery_note as string) || "",
    siteName: (r.site_name as string) || "",
    projectId: (r.project_id as string) || null,
    depotId: (r.depot_id as string) || null,
    destinationDepotId: (r.destination_depot_id as string) || null,
    notes: (r.notes as string) || "",
    createdAt: r.created_at as string,
    traitementLink: parseStockTraitementLink((r.notes as string) || ""),
  };
}

export type StockMovementBody = {
  itemId?: string;
  movementType?: StockMovementType;
  movementDate?: string;
  qty?: number;
  unitPrice?: number;
  unit?: string;
  articleCode?: string;
  assignment?: string;
  exitVoucherNo?: string;
  requester?: string;
  storekeeper?: string;
  supplier?: string;
  deliveryNote?: string;
  projectId?: string;
  depotId?: string;
  destinationDepotId?: string;
  notes?: string;
};

export async function resolveExitVoucherNo(
  organizationId: string,
  movementType: StockMovementType,
  provided?: string,
) {
  const trimmed = provided?.trim() ?? "";
  if (trimmed) return trimmed;
  if (movementType === "exit") {
    return nextExitVoucherNumber(organizationId);
  }
  return "";
}

export async function fetchStockItemForMovement(
  organizationId: string,
  itemId: string,
) {
  return getSupabaseAdminClient()
    .from("admin_stock_items")
    .select("id, reference, designation, category, qty, unit_price, unit, article_code")
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .single();
}
