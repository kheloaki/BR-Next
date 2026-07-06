import { formatMoney } from "@/lib/admin/price-ht-ttc";

export { formatDateFr, formatDateTimeFr, isoToFrDate } from "@/lib/admin/date-time-fr";

export function formatMad(value: number): string {
  return `${formatMoney(value)} MAD`;
}

export function formatQty(value: number, unit = ""): string {
  const n = new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 2 }).format(value);
  return unit ? `${n} ${unit}` : n;
}

export function formatLitres(value: number): string {
  return `${formatQty(value)} L`;
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 1 }).format(value)} %`;
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

export function str(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export function row(...cells: unknown[]): string[] {
  return cells.map((c) => str(c));
}
