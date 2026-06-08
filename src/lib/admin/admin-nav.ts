import type { AdminSection } from "@/components/admin/AdminSidebar";
import { FACTURATION_SIDEBAR_ITEMS } from "@/lib/admin/facturation-nav";
import { FINANCE_NAV_ITEMS } from "@/lib/admin/finance-nav";
import { FUEL_CONSOMMATION_NAV_ITEM, FUEL_NAV_ITEMS } from "@/lib/admin/fuel-nav";
import { RENTAL_NAV_ITEMS } from "@/lib/admin/rental-nav";

export type AdminNavItem = {
  href: string;
  label: string;
  section: AdminSection;
};

export type AdminNavGroup = {
  label?: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    items: [{ href: "/admin", label: "Tableau de bord", section: "dashboard" }],
  },
  {
    label: "Commercial",
    items: FACTURATION_SIDEBAR_ITEMS.map(({ href, label, section }) => ({ href, label, section })),
  },
  {
    label: "Finance",
    items: FINANCE_NAV_ITEMS.map(({ href, label, section }) => ({ href, label, section })),
  },
  {
    label: "Référentiel",
    items: [
      { href: "/admin/customers", label: "Clients", section: "customers" },
      { href: "/admin/suppliers", label: "Fournisseurs", section: "suppliers" },
      { href: "/admin/products", label: "Produits", section: "products" },
    ],
  },
  {
    label: "Chantiers",
    items: [
      { href: "/admin/projets", label: "Projets", section: "projets" },
      { href: "/admin/depots", label: "Dépôts", section: "depots" },
      { href: "/admin/personnel", label: "Personnel", section: "personnel" },
      { href: "/admin/etats", label: "États ERP", section: "etats" },
      {
        href: FUEL_CONSOMMATION_NAV_ITEM.href,
        label: FUEL_CONSOMMATION_NAV_ITEM.label,
        section: FUEL_CONSOMMATION_NAV_ITEM.section,
      },
    ],
  },
  {
    label: "Approvisionnement",
    items: [
      { href: "/admin/stock", label: "Stock", section: "stock" },
      { href: "/admin/parts", label: "Pièces & lubrifiants", section: "parts" },
      { href: "/admin/purchase-requests", label: "Demandes d'achat", section: "purchase-requests" },
      { href: "/admin/traitements-achat", label: "Traitement achat", section: "traitements-achat" },
      { href: "/admin/traitements-vente", label: "Traitement vente", section: "traitements-vente" },
    ],
  },
  {
    label: "Matériel & location",
    items: RENTAL_NAV_ITEMS.map(({ href, label, section }) => ({ href, label, section })),
  },
  {
    label: "Carburant",
    items: FUEL_NAV_ITEMS.map(({ href, label, section }) => ({ href, label, section })),
  },
  {
    label: "Ressources humaines",
    items: [{ href: "/admin/hr", label: "RH & pointage", section: "hr" }],
  },
  {
    label: "Administration",
    items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", section: "utilisateurs" }],
  },
];
