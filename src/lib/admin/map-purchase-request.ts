import type { PurchaseCategory, PurchaseRequestStatus } from "@/components/admin/operations-types";
import {
  parsePurchaseRequestLines,
  type PurchaseRequestLine,
} from "@/lib/admin/map-purchase-request-lines";
import { GASOIL_UNIT } from "@/lib/admin/gasoil-stock";

export type { PurchaseRequestLine };

export function isGasoilPurchaseRequest(da: { number: string }) {
  return da.number.startsWith("DA-GASOIL-");
}

export function mapPurchaseRequestRow(r: Record<string, unknown>) {
  const lines = parsePurchaseRequestLines(r);
  const primary = lines[0];
  const isGasoil = isGasoilPurchaseRequest({ number: String(r.number ?? "") });
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    number: r.number as string,
    category: r.category as PurchaseCategory,
    subject: r.subject as string,
    reference: primary?.reference ?? ((r.reference as string) || ""),
    designation: primary?.designation ?? ((r.designation as string) || ""),
    unit: isGasoil ? GASOIL_UNIT : primary?.unit ?? ((r.unit as string) || "PIECE"),
    productId: primary?.productId ?? ((r.product_id as string) || null),
    qty: primary?.qty ?? Number(r.qty ?? 0),
    unitPrice: primary?.unitPrice ?? Number(r.unit_price ?? 0),
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
    stockItemId: primary?.stockItemId ?? ((r.stock_item_id as string) || null),
    stockQtyAtRequest: r.stock_qty_snapshot != null ? Number(r.stock_qty_snapshot) : null,
    lines,
  };
}
