import type { AdminSection } from "@/components/admin/AdminSidebar";
import { traitementsHref } from "@/lib/admin/traitement-nav";

export type FuelView = "consommation" | "stock" | "bons" | "commande";

export const FUEL_NAV_ITEMS: {
  href: string;
  label: string;
  section: AdminSection;
  view: FuelView;
}[] = [
  { href: "/admin/fuel/stock", label: "Stock gasoil", section: "fuel-stock", view: "stock" },
  { href: "/admin/fuel/bons", label: "Bons de sortie", section: "fuel-bons", view: "bons" },
];

/** Affiché sous Chantiers — analyse croisée location + gasoil. */
export const FUEL_CONSOMMATION_NAV_ITEM = {
  href: "/admin/fuel/consommation",
  label: "Conso. & location",
  section: "fuel-consommation" as AdminSection,
  view: "consommation" as FuelView,
};

export const FUEL_VIEW_META: Record<
  FuelView,
  { title: string; description: string; exportHref?: string }
> = {
  consommation: {
    title: "Analyse consommation & location",
    description:
      "Heures location, coût HT location, gasoil consommé, L/h et MAD/h — par matériel du catalogue.",
    exportHref: "/api/admin/fuel/consommation",
  },
  stock: {
    title: "Stock gasoil",
    description:
      "Inventaire gasoil, mouvements de stock et journal des bons de sortie — entrées via traitement achat, sorties via bon de sortie.",
    exportHref: "/api/admin/fuel",
  },
  commande: {
    title: "Bon de commande gasoil",
    description: "Commandes carburant — entrée stock sur chantier. Téléchargez le PDF si besoin.",
  },
  bons: {
    title: "Bons de sortie gasoil",
    description: "Bons de sortie — distribution carburant sur le matériel et les véhicules.",
  },
};

/** Legacy ?tab= query → route path segment */
export const FUEL_TAB_REDIRECT: Record<string, string> = {
  log: "/admin/fuel/stock?tab=journal",
  journal: "/admin/fuel/stock?tab=journal",
  stock: "/admin/fuel/stock",
  commande: traitementsHref({ type: "achat" }),
  achat: traitementsHref({ type: "achat" }),
  bons: "/admin/fuel/bons",
  stats: "/admin/fuel/consommation",
  new: "/admin/fuel/bons",
};

export function isFuelPath(pathname: string) {
  if (pathname === FUEL_CONSOMMATION_NAV_ITEM.href) return false;
  return pathname === "/admin/fuel" || pathname.startsWith("/admin/fuel/");
}

export function isFuelConsommationPath(pathname: string) {
  return pathname === FUEL_CONSOMMATION_NAV_ITEM.href || pathname.startsWith(`${FUEL_CONSOMMATION_NAV_ITEM.href}/`);
}
