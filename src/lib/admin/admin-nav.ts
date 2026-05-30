import type { AdminSection } from "@/components/admin/AdminSidebar";
import { FACTURATION_NAV_ITEMS } from "@/lib/admin/facturation-nav";
import { FUEL_NAV_ITEMS } from "@/lib/admin/fuel-nav";
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
    label: "Facturation",
    items: FACTURATION_NAV_ITEMS.map(({ href, label, section }) => ({ href, label, section })),
  },
  {
    label: "Carnet",
    items: [
      { href: "/admin/customers", label: "Clients", section: "customers" },
      { href: "/admin/suppliers", label: "Fournisseurs", section: "suppliers" },
      { href: "/admin/products", label: "Produits", section: "products" },
    ],
  },
  {
    label: "Projets & sites",
    items: [
      { href: "/admin/projets", label: "Projets (chantiers)", section: "projets" },
      { href: "/admin/depots", label: "Dépôts", section: "depots" },
      { href: "/admin/personnel", label: "Personnel", section: "personnel" },
    ],
  },
  {
    label: "Stock & Achats",
    items: [
      { href: "/admin/stock", label: "Gestion de stock", section: "stock" },
      { href: "/admin/purchase-requests", label: "Demandes d'achat", section: "purchase-requests" },
    ],
  },
  {
    label: "Carburant",
    items: FUEL_NAV_ITEMS.map(({ href, label, section }) => ({ href, label, section })),
  },
  {
    label: "Opérations",
    items: [
      { href: "/admin/drilling", label: "Rapport foration", section: "drilling" },
      { href: "/admin/production", label: "Production", section: "production" },
      { href: "/admin/parts", label: "Pièces & lubrifiants", section: "parts" },
      ...RENTAL_NAV_ITEMS.map(({ href, label, section }) => ({ href, label, section })),
    ],
  },
  {
    label: "Logistique & RH",
    items: [
      { href: "/admin/logistics", label: "Logistique & voyages", section: "logistics" },
      { href: "/admin/hr", label: "RH & pointage", section: "hr" },
    ],
  },
  {
    label: "Administration",
    items: [{ href: "/admin/utilisateurs", label: "Utilisateurs", section: "utilisateurs" }],
  },
];
