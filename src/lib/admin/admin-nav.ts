import type { AdminSection } from "@/components/admin/AdminSidebar";
import { FACTURATION_SIDEBAR_ITEMS } from "@/lib/admin/facturation-nav";
import { FINANCE_NAV_ITEMS } from "@/lib/admin/finance-nav";
import { FUEL_CONSOMMATION_NAV_ITEM, FUEL_NAV_ITEMS } from "@/lib/admin/fuel-nav";
import { RENTAL_NAV_ITEMS } from "@/lib/admin/rental-nav";

export type AdminNavItem = {
  href: string;
  label: string;
  section: AdminSection;
  keywords?: string;
};

export type AdminNavGroup = {
  label?: string;
  items: AdminNavItem[];
};

/** Accès rapide — pages les plus utilisées au quotidien. */
export const ADMIN_NAV_SHORTCUTS: AdminNavItem[] = [
  { href: "/admin/projets", label: "Projets", section: "projets", keywords: "chantier" },
  { href: "/admin/facturation/documents", label: "Documents", section: "saved", keywords: "devis facture bc" },
  { href: "/admin/hr", label: "Pointage", section: "hr", keywords: "rh présence" },
  { href: "/admin/fuel/bons", label: "Bons gasoil", section: "fuel-bons", keywords: "carburant sortie" },
  { href: "/admin/traitements", label: "Traitements", section: "traitements", keywords: "achat vente" },
];

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    items: [{ href: "/admin", label: "Tableau de bord", section: "dashboard", keywords: "accueil home" }],
  },
  {
    label: "Ventes",
    items: FACTURATION_SIDEBAR_ITEMS.map(({ href, label, section }) => ({
      href,
      label,
      section,
      keywords: "devis facture bon commande livraison commercial",
    })),
  },
  {
    label: "Finance",
    items: FINANCE_NAV_ITEMS.map(({ href, label, section }) => ({
      href,
      label,
      section,
      keywords: "caisse banque trésorerie dépenses clôture paiement",
    })),
  },
  {
    label: "Contacts & produits",
    items: [
      { href: "/admin/customers", label: "Clients", section: "customers" },
      { href: "/admin/suppliers", label: "Fournisseurs", section: "suppliers" },
      { href: "/admin/products", label: "Produits", section: "products", keywords: "catalogue articles" },
    ],
  },
  {
    label: "Chantiers",
    items: [
      { href: "/admin/projets", label: "Projets", section: "projets", keywords: "chantier site" },
      { href: "/admin/depots", label: "Dépôts", section: "depots", keywords: "stock local" },
      { href: "/admin/personnel", label: "Personnel", section: "personnel", keywords: "employés équipe" },
      { href: "/admin/etats", label: "États ERP", section: "etats", keywords: "rapport synthèse" },
      {
        href: FUEL_CONSOMMATION_NAV_ITEM.href,
        label: FUEL_CONSOMMATION_NAV_ITEM.label,
        section: FUEL_CONSOMMATION_NAV_ITEM.section,
        keywords: "analyse gasoil location heures",
      },
    ],
  },
  {
    label: "Stock & achats",
    items: [
      { href: "/admin/stock", label: "Stock", section: "stock" },
      { href: "/admin/parts", label: "Pièces & lubrifiants", section: "parts", keywords: "consommables" },
      {
        href: "/admin/purchase-requests",
        label: "Demandes d'achat",
        section: "purchase-requests",
        keywords: "da commande",
      },
      { href: "/admin/traitements", label: "Traitements", section: "traitements", keywords: "achat vente réception" },
    ],
  },
  {
    label: "Parc & carburant",
    items: [
      ...RENTAL_NAV_ITEMS.map(({ href, label, section }) => ({
        href,
        label,
        section,
        keywords: "location matériel engin",
      })),
      ...FUEL_NAV_ITEMS.map(({ href, label, section }) => ({
        href,
        label,
        section,
        keywords: "gasoil carburant",
      })),
    ],
  },
  {
    label: "Ressources humaines",
    items: [{ href: "/admin/hr", label: "RH & pointage", section: "hr", keywords: "présence heures" }],
  },
  {
    label: "Administration",
    items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", section: "utilisateurs", keywords: "comptes accès" }],
  },
];

export function flattenAdminNav(): (AdminNavItem & { group?: string })[] {
  const out: (AdminNavItem & { group?: string })[] = [];
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      out.push({ ...item, group: group.label });
    }
  }
  return out;
}

export function isActiveNavPath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavGroupLabelForPath(pathname: string): string | undefined {
  for (const group of ADMIN_NAV_GROUPS) {
    if (!group.label) continue;
    if (group.items.some((item) => isActiveNavPath(pathname, item.href))) {
      return group.label;
    }
  }
  return undefined;
}

export function filterNavItems(query: string): (AdminNavItem & { group?: string })[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return flattenAdminNav().filter((item) => {
    const haystack = `${item.label} ${item.group ?? ""} ${item.keywords ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}
