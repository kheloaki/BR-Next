import type { AdminSection } from "@/components/admin/AdminSidebar";

export type FuelView = "journal" | "stock" | "bons" | "da-gasoil" | "stats" | "saisie";

export const FUEL_NAV_ITEMS: {
  href: string;
  label: string;
  section: AdminSection;
  view: FuelView;
}[] = [
  { href: "/admin/fuel/journal", label: "Journal", section: "fuel-journal", view: "journal" },
  { href: "/admin/fuel/stock", label: "Stock gasoil", section: "fuel-stock", view: "stock" },
  { href: "/admin/fuel/bons", label: "Bons gasoil", section: "fuel-bons", view: "bons" },
  { href: "/admin/fuel/da-gasoil", label: "DA Gasoil", section: "fuel-da-gasoil", view: "da-gasoil" },
  { href: "/admin/fuel/stats", label: "Par engin", section: "fuel-stats", view: "stats" },
  { href: "/admin/fuel/saisie", label: "Nouvelle saisie", section: "fuel-saisie", view: "saisie" },
];

export const FUEL_VIEW_META: Record<
  FuelView,
  { title: string; description: string; exportHref?: string }
> = {
  journal: {
    title: "Journal carburant",
    description: "Historique des saisies gasoil par engin et chantier.",
    exportHref: "/api/admin/fuel?format=csv",
  },
  stock: {
    title: "Stock gasoil",
    description: "Inventaire gasoil et mouvements (hors gestion de stock générale).",
  },
  bons: {
    title: "Bons gasoil",
    description: "Bons d'achat et de sortie par catégorie véhicule.",
  },
  "da-gasoil": {
    title: "DA Gasoil",
    description: "Demandes d'achat carburant liées aux chantiers.",
  },
  stats: {
    title: "Consommation par engin",
    description: "Répartition des litres consommés par engin.",
  },
  saisie: {
    title: "Nouvelle saisie",
    description: "Enregistrer une distribution carburant sur chantier.",
  },
};

/** Legacy ?tab= query → route path segment */
export const FUEL_TAB_REDIRECT: Record<string, string> = {
  log: "/admin/fuel/journal",
  stock: "/admin/fuel/stock",
  bons: "/admin/fuel/bons",
  "da-gasoil": "/admin/fuel/da-gasoil",
  stats: "/admin/fuel/stats",
  new: "/admin/fuel/saisie",
};

export function isFuelPath(pathname: string) {
  return pathname === "/admin/fuel" || pathname.startsWith("/admin/fuel/");
}
