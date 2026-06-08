import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlobalEtatsPanel } from "@/components/admin/GlobalEtatsPanel";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "États ERP",
  robots: { index: false, follow: false },
};

export default async function AdminEtatsPage() {
  await requireAdminPage("/admin/etats");
  return (
    <AdminShell active="etats">
      <GlobalEtatsPanel />
    </AdminShell>
  );
}
