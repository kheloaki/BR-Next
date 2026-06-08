export const BON_NUMBER_LENGTH = 6;

/** Format user input: 1 → 000001, 10 → 000010. Legacy values with letters are kept as-is. */
export function formatBonLocationNo(input: string | number): string {
  const s = String(input).trim();
  if (!s) return "";
  if (/[a-zA-Z]/.test(s)) return s;
  const digits = s.replace(/\D/g, "");
  if (!digits) return "";
  const n = parseInt(digits, 10);
  if (Number.isNaN(n) || n <= 0) return "";
  if (n > 999999) return String(999999).padStart(BON_NUMBER_LENGTH, "0");
  return String(n).padStart(BON_NUMBER_LENGTH, "0");
}

export function parseSeqFromContractNo(contractNo: string): number | null {
  const trimmed = contractNo.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) {
    const n = parseInt(trimmed, 10);
    return Number.isNaN(n) ? null : n;
  }
  const tail = trimmed.match(/(\d+)$/);
  if (!tail) return null;
  const n = parseInt(tail[1], 10);
  return Number.isNaN(n) ? null : n;
}
