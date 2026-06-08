export const PRODUCT_UNITS = ["u", "m", "m²", "ml", "l", "kg", "t", "h", "j", "forfait"] as const;

export type ProductCategory = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  reference: string;
  designation: string;
  category: string;
  unit: string;
  unitPrice: number;
};

export type Customer = {
  id: string;
  name: string;
  ice: string;
  city?: string;
  address?: string;
};

export type Supplier = {
  id: string;
  /** Libellé affiché (nom fournisseur, société, ou les deux). */
  name: string;
  supplierName: string;
  companyName: string;
  ice: string;
  city?: string;
  address?: string;
  contact?: string;
  bankName?: string;
  rib?: string;
  supplyTypes?: import("@/lib/admin/supplier-types").SupplierSupplyType[];
};

export type CounterpartyKind = "client" | "supplier";

export type LineItem = {
  productId: string;
  reference: string;
  designation: string;
  unit?: string;
  qty: number;
  unitPrice: number;
  isNote?: boolean;
};

export type DocumentType = "devis" | "bon_commande" | "facture" | "bon_livraison";

export const DOCUMENT_TYPES: DocumentType[] = ["devis", "bon_commande", "facture", "bon_livraison"];

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  devis: "Devis",
  bon_commande: "Bon de commande",
  facture: "Facture",
  bon_livraison: "Bon de livraison",
};

/** Bons de commande use fournisseur; devis, factures et BL use client */
export function isSupplierDocument(type: DocumentType) {
  return type === "bon_commande";
}

/** Delivery note: quantities only on PDF/preview (no amounts). */
export function isDeliveryNote(type: DocumentType) {
  return type === "bon_livraison";
}

export const DOCUMENT_BADGE_CLASS: Record<DocumentType, string> = {
  devis: "bg-[var(--gold)]/15 text-[#8a4510]",
  bon_commande: "bg-[var(--navy)]/10 text-[var(--navy)]",
  facture: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
  bon_livraison: "bg-sky-50 text-sky-900 border border-sky-200/80",
};

export type QuoteDraft = {
  id: string;
  createdAt: string;
  documentType?: DocumentType;
  clientName: string;
  clientIce: string;
  clientAddress?: string;
  quoteNumber: string;
  reference: string;
  date: string;
  /** Date d'échéance (factures) */
  dueDate?: string;
  /** Facture source (bons de livraison) */
  linkedFactureId?: string;
  linkedFactureNumber?: string;
  vatRate: number;
  discount: number;
  deposit: number;
  items: LineItem[];
  includeCachet?: boolean;
  /** Lien traitement achat/vente */
  traitementId?: string;
  traitementStep?: import("@/lib/admin/traitement-types").TraitementStepKey;
  traitementType?: import("@/lib/admin/traitement-types").TraitementType;
  traitementNumber?: string;
  projectId?: string;
};

export type DevisTemplate = {
  sellerName: string;
  sellerActivity: string;
  sellerAddress: string;
  sellerLegal: string;
  sellerContact: string;
};

/** @deprecated Legacy localStorage keys — data is persisted via Supabase APIs. */
export const STORAGE_PRODUCTS = "barane-admin-products-v1";
/** @deprecated */
export const STORAGE_QUOTES = "barane-admin-quotes-v1";
/** @deprecated */
export const STORAGE_TEMPLATE = "barane-admin-devis-template-v1";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prd-default-tvf",
    reference: "TVF",
    designation: "FOURNITURE D'UN BATIMENT MODULAIRE DE 6.00X3.00M",
    category: "Modulaires",
    unit: "u",
    unitPrice: 28000,
  },
];

export const defaultTemplate: DevisTemplate = {
  sellerName: "BARANE INVEST SARL AU",
  sellerActivity: "TRAVAUX DIVERS -EQUIPEMENT INDUSTRIES",
  sellerAddress: "SIEGE SOCIAL : N130 BLOC 25 AVENUE MIMOSA HAY EL FARAH - AGADIR",
  sellerLegal:
    "PATENTE : 55006289 - IF : 68729921 - RC : 65885 / AGADIR - ICE : 003827708000049 - CNSS : 6464449",
  sellerContact: "EMAIL: contact@baraneinvest.com - SITE WEB : www.baraneinvest.com - GSM : 06.61.65.60.42",
};
