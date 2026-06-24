import type { DocumentType, QuoteDraft } from "@/components/admin/devis-types";

/** Parse `001/2026` → 1. Plain `001` also accepted. */
export function parseDocumentNumberSeq(quoteNumber: string): number | null {
  const trimmed = String(quoteNumber ?? "").trim();
  const withYear = trimmed.match(/^(\d+)\s*\/\s*(\d{4})$/);
  if (withYear) {
    const seq = parseInt(withYear[1], 10);
    return Number.isNaN(seq) || seq <= 0 ? null : seq;
  }
  if (/^\d+$/.test(trimmed)) {
    const seq = parseInt(trimmed, 10);
    return Number.isNaN(seq) || seq <= 0 ? null : seq;
  }
  return null;
}

export function parseDocumentNumberYear(quoteNumber: string): number | null {
  const m = String(quoteNumber ?? "")
    .trim()
    .match(/\/(\d{4})$/);
  if (!m) return null;
  const y = Number(m[1]);
  return Number.isFinite(y) ? y : null;
}

export function yearFromDate(dateStr?: string): number {
  if (!dateStr?.trim()) return new Date().getFullYear();
  const y = parseInt(dateStr.slice(0, 4), 10);
  return Number.isNaN(y) ? new Date().getFullYear() : y;
}

export function formatDocumentNumber(seq: number, year: number, padLen = 3): string {
  return `${String(seq).padStart(padLen, "0")}/${year}`;
}

function quoteSeriesYear(quote: QuoteDraft): number {
  return parseDocumentNumberYear(quote.quoteNumber ?? "") ?? yearFromDate(quote.date);
}

function padLenForSeries(quotes: QuoteDraft[]): number {
  let padLen = 3;
  for (const q of quotes) {
    const m = String(q.quoteNumber ?? "").match(/^(\d+)/);
    if (m) padLen = Math.max(padLen, m[1].length);
  }
  return padLen;
}

/**
 * Next document number for a type + calendar year.
 * Uses document count (1, 2, 3…) — not the highest stored sequence —
 * so a backdated day or manual high number does not skip the series.
 */
export function computeNextDocumentNumber(
  quotes: QuoteDraft[],
  type: DocumentType,
  year?: number,
): string {
  const y = year ?? new Date().getFullYear();
  const sameTypeYear = quotes.filter(
    (q) => (q.documentType ?? "devis") === type && quoteSeriesYear(q) === y,
  );
  const nextSeq = sameTypeYear.length + 1;
  return formatDocumentNumber(nextSeq, y, padLenForSeries(sameTypeYear));
}
