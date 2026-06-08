import type { DocumentType, QuoteDraft } from "@/components/admin/devis-types";
import { DEFAULT_VAT_RATE } from "@/lib/admin/price-ht-ttc";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function computeNextDocumentNumber(quotes: QuoteDraft[], type: DocumentType): string {
  const sameType = quotes.filter((q) => (q.documentType ?? "devis") === type);
  if (sameType.length === 0) {
    return `001/${new Date().getFullYear()}`;
  }
  let maxNum = 0;
  let templateStr = sameType[0].quoteNumber || "";
  for (const q of sameType) {
    const numberMatch = (q.quoteNumber || "").match(/\d+/);
    if (numberMatch) {
      const n = parseInt(numberMatch[0], 10);
      if (n > maxNum) {
        maxNum = n;
        templateStr = q.quoteNumber || "";
      }
    }
  }
  const next = maxNum + 1;
  const formatMatch = templateStr.match(/^(\D*)(\d+)(.*)$/);
  if (!formatMatch) return String(next);
  const [, prefix, digits, suffix] = formatMatch;
  const padded = String(next).padStart(digits.length, "0");
  const currentYear = String(new Date().getFullYear());
  const updatedSuffix = suffix.replace(/(19|20)\d{2}/, currentYear);
  return `${prefix}${padded}${updatedSuffix}`;
}

/** Prefill a new delivery note from a saved invoice. */
export function buildBonLivraisonFromFacture(
  facture: QuoteDraft,
  allQuotes: QuoteDraft[],
): Omit<QuoteDraft, "id"> & { id?: string } {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: uid("qte"),
    createdAt: new Date().toISOString(),
    documentType: "bon_livraison",
    clientName: facture.clientName,
    clientIce: facture.clientIce,
    clientAddress: facture.clientAddress,
    quoteNumber: computeNextDocumentNumber(allQuotes, "bon_livraison"),
    reference: facture.reference ? `${facture.reference}-BL` : `BL-${facture.quoteNumber || ""}`,
    date: today,
    vatRate: facture.vatRate ?? DEFAULT_VAT_RATE,
    discount: 0,
    deposit: 0,
    items: facture.items.map((item) => ({ ...item })),
    includeCachet: facture.includeCachet,
    linkedFactureId: facture.id,
    linkedFactureNumber: facture.quoteNumber,
  };
}

export function facturationBonLivraisonFromFacturePath(factureId: string) {
  return `/admin/facturation/bon-livraison?fromFacture=${encodeURIComponent(factureId)}`;
}
