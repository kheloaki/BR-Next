import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { StockManager } from "@/components/admin/StockManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Gestion de stock",
  robots: { index: false, follow: false },
};

export default async function AdminStockPage() {
  await requireAdminPage("/admin/stock");
  return (
    <AdminShell active="stock">
      <StockManager />
    </AdminShell>
  );
}
