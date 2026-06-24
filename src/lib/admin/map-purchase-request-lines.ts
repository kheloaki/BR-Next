import { GASOIL_UNIT } from "@/lib/admin/gasoil-stock";

export type PurchaseRequestLine = {
  reference: string;
  designation: string;
  unit: string;
  productId: string | null;
  stockItemId: string | null;
  qty: number;
  unitPrice: number;
};

export function emptyPurchaseRequestLine(): PurchaseRequestLine {
  return {
    reference: "",
    designation: "",
    unit: "PIECE",
    productId: null,
    stockItemId: null,
    qty: 1,
    unitPrice: 0,
  };
}

function isGasoilPurchaseRow(row: Record<string, unknown>): boolean {
  const number = String(row.number ?? "");
  return number.startsWith("DA-GASOIL-") || row.category === "fuel";
}

function defaultUnitForRow(row: Record<string, unknown>): string {
  return isGasoilPurchaseRow(row) ? GASOIL_UNIT : "PIECE";
}

function normalizeLine(raw: Record<string, unknown>, fallbackUnit = "PIECE"): PurchaseRequestLine {
  return {
    reference: String(raw.reference ?? "").trim(),
    designation: String(raw.designation ?? "").trim(),
    unit: String(raw.unit ?? fallbackUnit).trim() || fallbackUnit,
    productId: (raw.productId as string) || (raw.product_id as string) || null,
    stockItemId: (raw.stockItemId as string) || (raw.stock_item_id as string) || null,
    qty: Math.max(0, Number(raw.qty ?? 0) || 0),
    unitPrice: Math.max(0, Number(raw.unitPrice ?? raw.unit_price ?? 0) || 0),
  };
}

export function parsePurchaseRequestLines(
  row: Record<string, unknown>,
): PurchaseRequestLine[] {
  const fallbackUnit = defaultUnitForRow(row);
  const raw = row.lines;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((l) => normalizeLine(l as Record<string, unknown>, fallbackUnit));
  }
  const designation = String(row.designation ?? "").trim();
  const reference = String(row.reference ?? "").trim();
  const qty = Number(row.qty ?? 0);
  if (!designation && !reference && qty <= 0) return [];
  return [
    {
      reference,
      designation: designation || String(row.subject ?? "").trim(),
      unit: fallbackUnit,
      productId: (row.product_id as string) || null,
      stockItemId: (row.stock_item_id as string) || null,
      qty,
      unitPrice: Math.max(0, Number(row.unit_price ?? 0) || 0),
    },
  ];
}

export function purchaseRequestLinesTotal(lines: PurchaseRequestLine[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
}

export function serializePurchaseRequestLines(lines: PurchaseRequestLine[]) {
  return lines.map((l) => ({
    reference: l.reference.trim(),
    designation: l.designation.trim(),
    unit: l.unit.trim() || "PIECE",
    product_id: l.productId?.trim() || null,
    stock_item_id: l.stockItemId?.trim() || null,
    qty: l.qty,
    unit_price: l.unitPrice,
  }));
}
