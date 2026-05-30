import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { LogisticsManager } from "@/components/admin/LogisticsManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Logistique & voyages",
  robots: { index: false, follow: false },
};

export default async function AdminLogisticsPage() {
  await requireAdminPage("/admin/logistics");
  return (
    <AdminShell active="logistics">
      <LogisticsManager />
    </AdminShell>
  );
}
