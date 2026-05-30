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
