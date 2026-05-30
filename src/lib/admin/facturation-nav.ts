import type { AdminSection } from "@/components/admin/AdminSidebar";
import type { DocumentType, QuoteDraft } from "@/components/admin/devis-types";

export const FACTURATION_NAV_ITEMS: {
  href: string;
  label: string;
  section: AdminSection;
  documentType?: DocumentType;
}[] = [
  { href: "/admin/facturation/devis", label: "Nouveau devis", section: "builder-devis", documentType: "devis" },
  {
    href: "/admin/facturation/bon-commande",
    label: "Nouveau bon de commande",
    section: "builder-bon-commande",
    documentType: "bon_commande",
  },
  {
    href: "/admin/facturation/facture",
    label: "Nouvelle facture",
    section: "builder-facture",
    documentType: "facture",
  },
  {
    href: "/admin/facturation/bon-livraison",
    label: "Nouveau bon de livraison",
    section: "builder-bon-livraison",
    documentType: "bon_livraison",
  },
  { href: "/admin/facturation/documents", label: "Documents enregistrés", section: "saved" },
];

export function isFacturationPath(pathname: string) {
  return pathname === "/admin/devis-builder" ||
    pathname === "/admin/devis-saved" ||
    pathname.startsWith("/admin/facturation");
}

/** Legacy routes → facturation */
export const FACTURATION_LEGACY_REDIRECT: Record<string, string> = {
  "/admin/devis-builder": "/admin/facturation/devis",
  "/admin/devis-saved": "/admin/facturation/documents",
};

const BUILDER_PATH: Record<DocumentType, string> = {
  devis: "/admin/facturation/devis",
  bon_commande: "/admin/facturation/bon-commande",
  facture: "/admin/facturation/facture",
  bon_livraison: "/admin/facturation/bon-livraison",
};

export function facturationBuilderPath(type: DocumentType) {
  return BUILDER_PATH[type];
}

export function facturationDocumentsPath(filter?: DocumentType) {
  const base = "/admin/facturation/documents";
  if (!filter) return base;
  return `${base}?filter=${filter}`;
}

export function parseDocumentsFilterParam(
  value: string | null | undefined,
): DocumentType | "all" {
  if (value === "devis" || value === "bon_commande" || value === "facture" || value === "bon_livraison") {
    return value;
  }
  return "all";
}

export function facturationEditPath(quote: Pick<QuoteDraft, "id" | "documentType">) {
  const type = quote.documentType ?? "devis";
  return `${facturationBuilderPath(type)}?id=${encodeURIComponent(quote.id)}`;
}

export function facturationSectionForType(type: DocumentType): AdminSection {
  if (type === "bon_commande") return "builder-bon-commande";
  if (type === "facture") return "builder-facture";
  if (type === "bon_livraison") return "builder-bon-livraison";
  return "builder-devis";
}

export function documentTypeFromLegacyParam(type: string | null | undefined): DocumentType | null {
  if (type === "devis" || type === "bon_commande" || type === "facture" || type === "bon_livraison") {
    return type;
  }
  return null;
}

export { facturationBonLivraisonFromFacturePath } from "@/lib/admin/bon-livraison";
