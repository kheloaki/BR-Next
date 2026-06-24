import type { QuoteDraft } from "@/components/admin/devis-types";
import { computeNextDocumentNumber, yearFromDate } from "@/lib/admin/document-number";
import { DEFAULT_VAT_RATE } from "@/lib/admin/price-ht-ttc";

export { computeNextDocumentNumber };

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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
    quoteNumber: computeNextDocumentNumber(allQuotes, "bon_livraison", yearFromDate(today)),
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
