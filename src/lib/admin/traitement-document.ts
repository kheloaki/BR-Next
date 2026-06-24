import type { DocumentType, LineItem, QuoteDraft } from "@/components/admin/devis-types";
import { facturationBuilderPath, facturationEditPath } from "@/lib/admin/facturation-nav";
import { traitementReturnPath } from "@/lib/admin/traitement-nav";
import { resolveDocumentClientNameForTraitement } from "@/lib/admin/quote-counterparty";
import type { Traitement, TraitementStepKey, TraitementType } from "@/lib/admin/traitement-types";

export { traitementReturnPath };

export function traitementStepToDocumentType(
  step: TraitementStepKey,
  traitementType: TraitementType,
): DocumentType | null {
  if (step === "bc" && traitementType === "achat") return "bon_commande";
  if (step === "devis" && traitementType === "vente") return "devis";
  if (step === "bl") return "bon_livraison";
  if (step === "f") return "facture";
  return null;
}

export function traitementDocumentBuilderPath(
  traitementType: TraitementType,
  step: TraitementStepKey,
  traitementId: string,
): string | null {
  const docType = traitementStepToDocumentType(step, traitementType);
  if (!docType) return null;
  const base = facturationBuilderPath(docType);
  const params = new URLSearchParams({
    traitementId,
    step,
    traitementType,
  });
  return `${base}?${params.toString()}`;
}

export function traitementLinesToQuoteItems(traitement: Traitement): LineItem[] {
  return traitement.lines.map((line) => ({
    productId: line.productId || `tr-${line.id}`,
    reference: line.reference || "NN",
    designation: line.designation,
    unit: line.unit || "u",
    qty: line.qty,
    unitPrice: line.unitPrice,
  }));
}

export function buildQuoteDraftFromTraitement(
  traitement: Traitement,
  step: TraitementStepKey,
  documentType: DocumentType,
  quoteNumber: string,
  opts?: { suppliers?: import("@/components/admin/devis-types").Supplier[]; customers?: import("@/components/admin/devis-types").Customer[] },
): Partial<QuoteDraft> {
  const linkedBc = traitement.steps.bc;
  const linkedDevis = traitement.steps.devis;
  const linkedFacture = traitement.steps.f;

  const clientName =
    opts?.suppliers || opts?.customers
      ? resolveDocumentClientNameForTraitement(
          traitement,
          opts.suppliers ?? [],
          opts.customers ?? [],
        )
      : traitement.partnerName.trim() || traitement.label;

  const draft: Partial<QuoteDraft> = {
    documentType,
    clientName,
    reference: traitement.label,
    date: new Date().toISOString().slice(0, 10),
    items: traitementLinesToQuoteItems(traitement),
    traitementId: traitement.id,
    traitementStep: step,
    traitementType: traitement.traitementType,
    traitementNumber: traitement.number,
    projectId: traitement.projectId ?? undefined,
  };

  if (documentType === "bon_livraison" && traitement.traitementType === "vente" && linkedFacture?.quoteId) {
    draft.linkedFactureId = linkedFacture.quoteId;
    draft.linkedFactureNumber = linkedFacture.docNumber;
  }

  if (documentType === "facture") {
    const source = traitement.traitementType === "achat" ? linkedBc : linkedDevis;
    if (source?.docNumber) {
      draft.reference = `${traitement.label} · ${source.docNumber}`;
    }
  }

  if (quoteNumber) draft.quoteNumber = quoteNumber;

  return draft;
}

export function traitementDocumentHref(
  traitement: Traitement,
  step: TraitementStepKey,
): string | null {
  const existing = traitement.steps[step];
  if (existing?.quoteId) {
    const docType = traitementStepToDocumentType(step, traitement.traitementType);
    if (docType) {
      return facturationEditPath({ id: existing.quoteId, documentType: docType });
    }
  }
  return traitementDocumentBuilderPath(traitement.traitementType, step, traitement.id);
}

function quoteUid() {
  return `qte-${crypto.randomUUID()}`;
}

/** Build a complete QuoteDraft ready for POST /api/admin/quotes. */
export function buildTraitementQuoteDraft(
  traitement: Traitement,
  step: TraitementStepKey,
  fields: {
    quoteNumber: string;
    date: string;
    dueDate?: string;
    clientName: string;
    clientIce?: string;
    reference: string;
    vatRate: number;
    includeCachet?: boolean;
    existingQuoteId?: string;
    existingCreatedAt?: string;
  },
): import("@/components/admin/devis-types").QuoteDraft {
  const documentType = traitementStepToDocumentType(step, traitement.traitementType);
  if (!documentType) {
    throw new Error("Étape document invalide");
  }

  const base = buildQuoteDraftFromTraitement(traitement, step, documentType, fields.quoteNumber.trim());
  const isBl = documentType === "bon_livraison";

  return {
    id: fields.existingQuoteId || quoteUid(),
    createdAt: fields.existingCreatedAt || new Date().toISOString(),
    documentType,
    clientName: fields.clientName.trim() || traitement.partnerName.trim() || traitement.label,
    clientIce: fields.clientIce?.trim() || base.clientIce?.trim() || "",
    clientAddress: base.clientAddress,
    quoteNumber: fields.quoteNumber.trim(),
    reference: fields.reference.trim() || base.reference || traitement.label,
    date: fields.date,
    dueDate: documentType === "facture" && fields.dueDate ? fields.dueDate : undefined,
    linkedFactureId: base.linkedFactureId,
    linkedFactureNumber: base.linkedFactureNumber,
    vatRate: fields.vatRate,
    discount: isBl ? 0 : 0,
    deposit: isBl ? 0 : 0,
    items: base.items ?? [],
    includeCachet: fields.includeCachet ?? false,
    traitementId: traitement.id,
    traitementStep: step,
    traitementType: traitement.traitementType,
    traitementNumber: traitement.number,
    projectId: traitement.projectId ?? undefined,
  };
}
