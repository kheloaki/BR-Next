import { AdminComingSoonPanel } from "@/components/admin/AdminComingSoonPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata = {
  title: "Procès-verbaux chantier",
  robots: { index: false, follow: false },
};

export default async function AdminSitePvPage() {
  await requireAdminPage("/admin/pv");
  return (
    <AdminShell active="pv">
      <AdminComingSoonPanel title="Procès-verbaux chantier" />
    </AdminShell>
  );
}
