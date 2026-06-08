import type { Metadata } from "next";
import { AdminComingSoonPanel } from "@/components/admin/AdminComingSoonPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Rapports chantier",
  robots: { index: false, follow: false },
};

export default async function AdminSiteReportsPage() {
  await requireAdminPage("/admin/rapports");
  return (
    <AdminShell active="rapports">
      <AdminComingSoonPanel title="Rapports chantier" />
    </AdminShell>
  );
}
