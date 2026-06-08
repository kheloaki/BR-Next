import type { Metadata } from "next";
import { AdminComingSoonPanel } from "@/components/admin/AdminComingSoonPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Logistique & voyages",
  robots: { index: false, follow: false },
};

export default async function AdminLogisticsPage() {
  await requireAdminPage("/admin/logistics");
  return (
    <AdminShell active="logistics">
      <AdminComingSoonPanel title="Logistique & voyages" />
    </AdminShell>
  );
}
