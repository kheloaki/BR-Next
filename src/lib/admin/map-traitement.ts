import type { Traitement, TraitementLine, TraitementSteps, TraitementType } from "@/lib/admin/traitement-types";
import { normalizeTraitementSteps } from "@/lib/admin/traitement-types";
import { GASOIL_UNIT } from "@/lib/admin/gasoil-stock";

export function mapTraitementLine(
  row: Record<string, unknown>,
  supplyKind?: Traitement["supplyKind"],
): TraitementLine {
  return {
    id: row.id as string,
    productId: (row.product_id as string) || null,
    stockItemId: (row.stock_item_id as string) || null,
    reference: (row.reference as string) || "",
    designation: (row.designation as string) || "",
    unit: (row.unit as string) || (supplyKind === "gasoil" ? GASOIL_UNIT : "PIECE"),
    qty: Number(row.qty ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export function mapTraitementRow(
  row: Record<string, unknown>,
  lines: TraitementLine[] = [],
): Traitement {
  const type = row.traitement_type as TraitementType;
  return {
    id: row.id as string,
    traitementType: type,
    supplyKind: (row.supply_kind as Traitement["supplyKind"]) || "articles",
    number: row.number as string,
    label: (row.label as string) || "",
    projectId: (row.project_id as string) || null,
    depotId: (row.depot_id as string) || null,
    supplierId: (row.supplier_id as string) || null,
    customerId: (row.customer_id as string) || null,
    partnerName: (row.partner_name as string) || "",
    status: row.status as Traitement["status"],
    notes: (row.notes as string) || "",
    steps: normalizeTraitementSteps(type, row.steps as TraitementSteps),
    lines,
    purchaseRequestId: (row.purchase_request_id as string) || null,
    sourceTraitementId: (row.source_traitement_id as string) || null,
    venteTraitementId: (row.vente_traitement_id as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
