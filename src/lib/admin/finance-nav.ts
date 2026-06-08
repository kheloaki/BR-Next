import type { AdminSection } from "@/components/admin/AdminSidebar";

export const FINANCE_NAV_ITEMS: { href: string; label: string; section: AdminSection }[] = [
  { href: "/admin/finance/caisse", label: "Caisse", section: "finance-caisse" },
  { href: "/admin/finance/banque", label: "Banque", section: "finance-banque" },
  { href: "/admin/finance/tresorerie", label: "Trésorerie", section: "finance-tresorerie" },
  { href: "/admin/finance/clients", label: "Clients", section: "finance-clients" },
  { href: "/admin/finance/fournisseurs", label: "Fournisseurs", section: "finance-fournisseurs" },
  { href: "/admin/finance/depenses", label: "Dépenses", section: "finance-depenses" },
  { href: "/admin/finance/clotures", label: "Clôtures caisse", section: "finance-clotures" },
  { href: "/admin/finance/etats", label: "États finance", section: "finance-etats" },
];

export function isFinancePath(pathname: string) {
  return pathname === "/admin/finance" || pathname.startsWith("/admin/finance/");
}
