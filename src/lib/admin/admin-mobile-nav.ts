import type { LucideIcon } from "lucide-react";
import { FolderKanban, LayoutDashboard, MoreHorizontal, ShoppingBag, Wallet } from "lucide-react";
import type { AdminSection } from "@/components/admin/AdminSidebar";
import {
  ADMIN_NAV_GROUPS,
  flattenAdminNav,
  isActiveNavPath,
  type AdminNavItem,
} from "@/lib/admin/admin-nav";
import { isFacturationPath } from "@/lib/admin/facturation-nav";
import { isFinancePath } from "@/lib/admin/finance-nav";
import { isFuelConsommationPath, isFuelPath } from "@/lib/admin/fuel-nav";
import { isRentalPath } from "@/lib/admin/rental-nav";

export type AdminMobileTabId = "home" | "chantiers" | "achats" | "finance" | "plus";

export type AdminMobileTab = {
  id: AdminMobileTabId;
  label: string;
  icon: LucideIcon;
  href?: string;
  items: AdminNavItem[];
  description?: string;
};

function itemsFromGroup(label: string): AdminNavItem[] {
  return ADMIN_NAV_GROUPS.find((g) => g.label === label)?.items ?? [];
}

export const ADMIN_MOBILE_TABS: AdminMobileTab[] = [
  {
    id: "home",
    label: "Accueil",
    icon: LayoutDashboard,
    href: "/admin",
    items: [],
    description: "Tableau de bord et indicateurs",
  },
  {
    id: "chantiers",
    label: "Chantiers",
    icon: FolderKanban,
    items: [...itemsFromGroup("Chantiers"), ...itemsFromGroup("Ressources humaines")],
    description: "Projets, équipes et suivi terrain",
  },
  {
    id: "achats",
    label: "Achats",
    icon: ShoppingBag,
    items: itemsFromGroup("Stock & achats"),
    description: "Stock, pièces, demandes et traitements",
  },
  {
    id: "finance",
    label: "Finance",
    icon: Wallet,
    items: itemsFromGroup("Finance"),
    description: "Caisse, trésorerie et factures",
  },
  {
    id: "plus",
    label: "Plus",
    icon: MoreHorizontal,
    items: [
      ...itemsFromGroup("Ventes"),
      ...itemsFromGroup("Contacts & produits"),
      ...itemsFromGroup("Parc & carburant"),
      ...itemsFromGroup("Administration"),
    ],
    description: "Ventes, référentiel, parc et administration",
  },
];

export const ADMIN_MOBILE_NAV_HEIGHT = "4.25rem";

export function isMobileTabActive(tab: AdminMobileTab, pathname: string): boolean {
  if (tab.id === "home") return pathname === "/admin";
  if (tab.id === "finance") return isFinancePath(pathname);
  if (tab.id === "chantiers") {
    return (
      tab.items.some((item) => isActiveNavPath(pathname, item.href)) ||
      isFuelConsommationPath(pathname)
    );
  }
  if (tab.id === "achats") {
    return tab.items.some((item) => isActiveNavPath(pathname, item.href));
  }
  if (tab.id === "plus") {
    return (
      isFacturationPath(pathname) ||
      isFuelPath(pathname) ||
      isRentalPath(pathname) ||
      tab.items.some((item) => isActiveNavPath(pathname, item.href))
    );
  }
  return false;
}

export function findActiveMobileTab(pathname: string): AdminMobileTab {
  return ADMIN_MOBILE_TABS.find((tab) => isMobileTabActive(tab, pathname)) ?? ADMIN_MOBILE_TABS[4];
}

export function getMobilePageTitle(pathname: string): string {
  const flat = flattenAdminNav();
  const exact = flat.find((item) => isActiveNavPath(pathname, item.href));
  if (exact) return exact.label;
  if (pathname.startsWith("/admin/facturation/devis")) return "Devis";
  if (pathname.startsWith("/admin/facturation/bon-commande")) return "Bon de commande";
  if (pathname.startsWith("/admin/facturation/facture")) return "Facture";
  if (pathname.startsWith("/admin/facturation/bon-livraison")) return "Bon de livraison";
  if (pathname.startsWith("/admin/facturation")) return "Facturation";
  if (pathname.startsWith("/admin/finance/")) return "Finance";
  const tab = findActiveMobileTab(pathname);
  return tab.label;
}

export function sectionForPath(pathname: string): AdminSection | undefined {
  const flat = flattenAdminNav();
  return flat.find((item) => isActiveNavPath(pathname, item.href))?.section;
}
