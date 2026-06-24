import type { AdminSection } from "@/components/admin/AdminSidebar";
import { withAdminReturnUrl } from "@/lib/admin/admin-return-url";

export type FinanceFacturesTab = "clients" | "fournisseurs";

export const FINANCE_NAV_ITEMS: { href: string; label: string; section: AdminSection }[] = [
  { href: "/admin/finance/caisse", label: "Caisse & banque", section: "finance-caisse" },
  { href: "/admin/finance/tresorerie", label: "Trésorerie", section: "finance-tresorerie" },
  { href: "/admin/finance/factures", label: "Factures", section: "finance-factures" },
  { href: "/admin/finance/depenses", label: "Dépenses", section: "finance-depenses" },
  { href: "/admin/finance/clotures", label: "Clôtures caisse", section: "finance-clotures" },
];

export function financeFactureDetailHref(
  documentId: string,
  opts?: { encaisser?: boolean; payer?: boolean; returnTo?: string },
) {
  const base = `/admin/finance/factures/${encodeURIComponent(documentId)}`;
  const qs = new URLSearchParams();
  if (opts?.encaisser) qs.set("encaisser", "1");
  if (opts?.payer) qs.set("payer", "1");
  const q = qs.toString();
  let href = q ? `${base}?${q}` : base;
  if (opts?.returnTo) href = withAdminReturnUrl(href, opts.returnTo);
  return href;
}

export function financeFacturesHref(opts?: {
  tab?: FinanceFacturesTab;
  highlight?: string;
  projectId?: string;
}) {
  const qs = new URLSearchParams();
  if (opts?.tab === "fournisseurs") qs.set("tab", "fournisseurs");
  if (opts?.highlight) qs.set("highlight", opts.highlight);
  if (opts?.projectId) qs.set("projectId", opts.projectId);
  const q = qs.toString();
  return q ? `/admin/finance/factures?${q}` : "/admin/finance/factures";
}

export function isFinancePath(pathname: string) {
  return pathname === "/admin/finance" || pathname.startsWith("/admin/finance/");
}
