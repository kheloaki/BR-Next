import type { AdminSection } from "@/components/admin/AdminSidebar";

export type RentalView = "materials" | "bons";

export const RENTAL_NAV_ITEMS: {
  href: string;
  label: string;
  section: AdminSection;
  view: RentalView;
}[] = [
  {
    href: "/admin/equipment-rental/materials",
    label: "Catalogue matériel",
    section: "rental-materials",
    view: "materials",
  },
  {
    href: "/admin/equipment-rental/bons",
    label: "Bons location",
    section: "rental-bons",
    view: "bons",
  },
];

export const RENTAL_VIEW_META: Record<
  RentalView,
  { title: string; description: string; exportHref?: string }
> = {
  materials: {
    title: "Matériel location",
    description: "Fiches matériel par catégorie — chantier, tarif journalier (9 h), chauffeur et transport.",
    exportHref: "/api/admin/rental-materials",
  },
  bons: {
    title: "Bons location",
    description: "Bon de location avec conducteur — lieu de travaux, usage jr/h (1 jr = 9 h) et tarif.",
    exportHref: "/api/admin/rentals",
  },
};

export function isRentalPath(pathname: string) {
  return pathname === "/admin/equipment-rental" || pathname.startsWith("/admin/equipment-rental/");
}
