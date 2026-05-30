import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { PersonnelManager } from "@/components/admin/PersonnelManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Personnel",
  description: "Collaborateurs BARANE INVEST.",
  robots: { index: false, follow: false },
};

export default async function AdminPersonnelPage() {
  await requireAdminPage("/admin/personnel");
  return (
    <AdminShell active="personnel">
      <PersonnelManager />
    </AdminShell>
  );
}
