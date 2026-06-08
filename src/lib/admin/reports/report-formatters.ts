import { formatMoney } from "@/lib/admin/price-ht-ttc";

export function formatMad(value: number): string {
  return `${formatMoney(value)} MAD`;
}

export function formatDateFr(value: string | null | undefined): string {
  if (!value) return "—";
  const d = value.slice(0, 10);
  const parsed = new Date(`${d}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
