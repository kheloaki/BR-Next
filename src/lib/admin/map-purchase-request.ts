import type { PurchaseCategory, PurchaseRequestStatus } from "@/components/admin/operations-types";

export function isGasoilPurchaseRequest(da: { number: string }) {
  return da.number.startsWith("DA-GASOIL-");
}

export function mapPurchaseRequestRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    number: r.number as string,
    category: r.category as PurchaseCategory,
    subject: r.subject as string,
    reference: (r.reference as string) || "",
    designation: (r.designation as string) || "",
    unit: (r.unit as string) || "PIECE",
    productId: (r.product_id as string) || null,
    qty: Number(r.qty ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    totalAmount: Number(r.total_amount ?? 0),
    supplier: r.supplier as string,
    urgency: r.urgency as string,
    deliveryDate: (r.delivery_date as string) || "",
    justification: r.justification as string,
    requester: r.requester as string,
    status: r.status as PurchaseRequestStatus,
    createdAt: r.created_at as string,
    approvedAt: (r.approved_at as string) || null,
    approvedBy: (r.approved_by as string) || null,
    traitementId: (r.traitement_id as string) || null,
    pumpMeter: r.pump_meter != null ? Number(r.pump_meter) : null,
    stockItemId: (r.stock_item_id as string) || null,
    stockQtyAtRequest: r.stock_qty_snapshot != null ? Number(r.stock_qty_snapshot) : null,
  };
}
