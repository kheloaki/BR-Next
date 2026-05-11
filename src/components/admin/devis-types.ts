export type Product = {
  id: string;
  reference: string;
  designation: string;
  unitPrice: number;
};

export type Customer = {
  id: string;
  name: string;
  ice: string;
  city?: string;
  address?: string;
};

export type LineItem = {
  productId: string;
  reference: string;
  designation: string;
  qty: number;
  unitPrice: number;
  isNote?: boolean;
};

export type DocumentType = "devis" | "bon_commande";

export const DOCUMENT_LABELS: Record<DocumentType, string> = {
  devis: "Devis",
  bon_commande: "Bon de commande",
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
  vatRate: number;
  discount: number;
  deposit: number;
  items: LineItem[];
};

export type DevisTemplate = {
  sellerName: string;
  sellerActivity: string;
  sellerAddress: string;
  sellerLegal: string;
  sellerContact: string;
};

export const STORAGE_PRODUCTS = "barane-admin-products-v1";
export const STORAGE_QUOTES = "barane-admin-quotes-v1";
export const STORAGE_TEMPLATE = "barane-admin-devis-template-v1";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prd-default-tvf",
    reference: "TVF",
    designation: "FOURNITURE D'UN BATIMENT MODULAIRE DE 6.00X3.00M",
    unitPrice: 28000,
  },
];

export const defaultTemplate: DevisTemplate = {
  sellerName: "BARANE INVEST SARL AU",
  sellerActivity: "TRAVAUX DIVERS -EQUIPEMENT INDUSTRIES",
  sellerAddress: "SIEGE SOCIAL : N130 BLOC 25 AVENUE MIMOSA HAY EL FARAH - AGADIR",
  sellerLegal:
    "PATENTE : 55006289 - IF : 68729921 - RC : 65885 / AGADIR - ICE : 003827708000049 - CNSS : 6464449",
  sellerContact: "EMAIL:Baraneinvest@gmail.com-GSM : 06.61.65.60.42",
};
