/** Canonical storage for catalog and devis lines is always HT (hors taxes). */

export const DEFAULT_VAT_RATE = 20;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function htToTtc(ht: number, vatRate: number): number {
  if (vatRate <= 0) return roundMoney(ht);
  return roundMoney(ht * (1 + vatRate / 100));
}

export function ttcToHt(ttc: number, vatRate: number): number {
  if (vatRate <= 0) return roundMoney(ttc);
  return roundMoney(ttc / (1 + vatRate / 100));
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Line total TTC from stored unit HT (matches per-line display). */
export function lineTotalTtc(qty: number, unitPriceHt: number, vatRate: number): number {
  return roundMoney(qty * htToTtc(unitPriceHt, vatRate));
}

/**
 * Sum of line TTC totals. Prefer this over htToTtc(sum HT) when unit prices were
 * entered as TTC then converted to HT — avoids cent drift on the footer total.
 */
export function linesTotalTtc(
  lines: { qty: number; unitPrice: number }[],
  vatRate: number,
): number {
  return roundMoney(lines.reduce((sum, line) => sum + lineTotalTtc(line.qty, line.unitPrice, vatRate), 0));
}

export type DocumentLineForTotals = {
  qty: number;
  unitPrice: number;
  isNote?: boolean;
};

/** Document / devis totals — TTC from sum of line TTC (not VAT on total HT). */
export function computeDocumentTotals(
  lines: DocumentLineForTotals[],
  vatRate: number,
  discount = 0,
  deposit = 0,
) {
  const billable = lines.filter((l) => !l.isNote);
  const totalHt = roundMoney(billable.reduce((acc, l) => acc + l.qty * l.unitPrice, 0));
  const grossTtc = linesTotalTtc(
    billable.map((l) => ({ qty: l.qty, unitPrice: l.unitPrice })),
    vatRate,
  );
  const netHt = roundMoney(Math.max(0, totalHt - discount));
  const discountTtc = discount > 0 ? htToTtc(discount, vatRate) : 0;
  const totalTtc = roundMoney(Math.max(0, grossTtc - discountTtc));
  const vatAmount = roundMoney(Math.max(0, totalTtc - netHt));
  const netToPay = roundMoney(Math.max(0, totalTtc - deposit));
  return { totalHt, netHt, grossTtc, vatAmount, totalTtc, netToPay };
}
