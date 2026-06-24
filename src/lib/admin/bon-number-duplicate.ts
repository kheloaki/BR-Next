import { formatBonLocationNo } from "@/lib/admin/rental-bon-number-format";

export function normalizeBonSerieNo(input: string): string {
  const formatted = formatBonLocationNo(input);
  return formatted || String(input ?? "").trim();
}

export function bonSerieNumbersMatch(a: string, b: string): boolean {
  const na = normalizeBonSerieNo(a);
  const nb = normalizeBonSerieNo(b);
  return na.length > 0 && nb.length > 0 && na === nb;
}

export function bonNumberAlreadyUsedMessage(number: string): string {
  const display = normalizeBonSerieNo(number) || number.trim();
  return `Le N° bon ${display} est déjà utilisé. Choisissez un autre numéro.`;
}

/** Client-side check against loaded rows before save. */
export function assertBonSerieNoAvailable(
  existing: { id: string; number: string }[],
  candidate: string,
  excludeId?: string,
): string | null {
  const normalized = normalizeBonSerieNo(candidate);
  if (!normalized) return null;
  const taken = existing.some(
    (row) => row.id !== excludeId && bonSerieNumbersMatch(row.number, normalized),
  );
  return taken ? bonNumberAlreadyUsedMessage(normalized) : null;
}
