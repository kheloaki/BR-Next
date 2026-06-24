import type { Customer, DocumentType, QuoteDraft, Supplier } from "@/components/admin/devis-types";
import { isSupplierDocument } from "@/components/admin/devis-types";
import { supplierDocumentCompanyName } from "@/lib/admin/map-supplier";
import type { Traitement } from "@/lib/admin/traitement-types";

function normName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchSupplierByName(suppliers: Supplier[], name: string): Supplier | undefined {
  const target = normName(name);
  if (!target) return undefined;
  return suppliers.find((s) => {
    const candidates = [s.name, s.supplierName, s.companyName].filter(Boolean).map(normName);
    return candidates.some((c) => c === target || c.includes(target) || target.includes(c));
  });
}

export function matchCustomerByName(customers: Customer[], name: string): Customer | undefined {
  const target = normName(name);
  if (!target) return undefined;
  return customers.find((c) => normName(c.name) === target);
}

export function counterpartyFieldsFromSupplier(s: Supplier) {
  return {
    clientName: supplierDocumentCompanyName(s),
    clientIce: s.ice.trim(),
    clientAddress: [s.address, s.city].filter(Boolean).join(" - "),
  };
}

export function counterpartyFieldsFromCustomer(c: Customer) {
  return {
    clientName: c.name,
    clientIce: c.ice.trim(),
    clientAddress: [c.address, c.city].filter(Boolean).join(" - "),
  };
}

/** Nom client/fournisseur imprimé sur le document issu d'un traitement. */
export function resolveDocumentClientNameForTraitement(
  traitement: Pick<Traitement, "traitementType" | "partnerName" | "label" | "supplierId" | "customerId">,
  suppliers: Supplier[],
  customers: Customer[],
): string {
  if (traitement.traitementType === "achat") {
    if (traitement.supplierId) {
      const s = suppliers.find((x) => x.id === traitement.supplierId);
      if (s) return supplierDocumentCompanyName(s);
    }
    const matched = matchSupplierByName(suppliers, traitement.partnerName);
    if (matched) return supplierDocumentCompanyName(matched);
  } else {
    if (traitement.customerId) {
      const c = customers.find((x) => x.id === traitement.customerId);
      if (c?.name.trim()) return c.name.trim();
    }
    const matched = matchCustomerByName(customers, traitement.partnerName);
    if (matched?.name.trim()) return matched.name.trim();
  }
  return traitement.partnerName.trim() || traitement.label;
}

/** Fill missing ICE / address; sur document fournisseur → société uniquement. */
export function enrichQuoteCounterparty(
  quote: QuoteDraft,
  suppliers: Supplier[],
  customers: Customer[],
  ids?: { supplierId?: string; customerId?: string },
): QuoteDraft {
  const docType = quote.documentType ?? "devis";
  const isPo = isSupplierDocument(docType);

  const supplierById = ids?.supplierId
    ? suppliers.find((s) => s.id === ids.supplierId)
    : undefined;
  const customerById = ids?.customerId
    ? customers.find((c) => c.id === ids.customerId)
    : undefined;

  const supplier =
    supplierById ??
    (isPo && quote.clientName.trim() ? matchSupplierByName(suppliers, quote.clientName) : undefined);
  const customer =
    customerById ??
    (!isPo && quote.clientName.trim() ? matchCustomerByName(customers, quote.clientName) : undefined);

  const ice = quote.clientIce?.trim() || supplier?.ice?.trim() || customer?.ice?.trim() || "";
  const address =
    quote.clientAddress?.trim() ||
    (supplier ? counterpartyFieldsFromSupplier(supplier).clientAddress : "") ||
    (customer ? counterpartyFieldsFromCustomer(customer).clientAddress : "");

  const documentClientName = supplier
    ? supplierDocumentCompanyName(supplier)
    : customer
      ? customer.name.trim()
      : quote.clientName;

  if (
    documentClientName === quote.clientName &&
    ice === (quote.clientIce?.trim() ?? "") &&
    address === (quote.clientAddress?.trim() ?? "")
  ) {
    return quote;
  }

  return {
    ...quote,
    clientName: documentClientName,
    clientIce: ice,
    clientAddress: address || quote.clientAddress,
  };
}

export function resolvePreviewCounterpartyIce(
  documentType: DocumentType,
  clientName: string,
  clientIce: string,
  suppliers: Supplier[],
  customers: Customer[],
  supplierId?: string,
  customerId?: string,
): string {
  if (clientIce.trim()) return clientIce.trim();
  const isPo = isSupplierDocument(documentType);
  if (isPo) {
    const byId = supplierId ? suppliers.find((s) => s.id === supplierId) : undefined;
    if (byId?.ice?.trim()) return byId.ice.trim();
    return matchSupplierByName(suppliers, clientName)?.ice?.trim() ?? "";
  }
  const byId = customerId ? customers.find((c) => c.id === customerId) : undefined;
  if (byId?.ice?.trim()) return byId.ice.trim();
  return matchCustomerByName(customers, clientName)?.ice?.trim() ?? "";
}
