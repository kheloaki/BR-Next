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
    label: "Matériel location",
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
    description: "Catalogue engins, camions, voitures et groupes électrogènes.",
  },
  bons: {
    title: "Bons location",
    description: "Bons journaliers liés au matériel du catalogue.",
    exportHref: "/api/admin/rentals?format=csv",
  },
};

export function isRentalPath(pathname: string) {
  return pathname === "/admin/equipment-rental" || pathname.startsWith("/admin/equipment-rental/");
}
