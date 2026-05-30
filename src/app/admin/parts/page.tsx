import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { PartsManager } from "@/components/admin/PartsManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Pièces & lubrifiants",
  robots: { index: false, follow: false },
};

export default async function AdminPartsPage() {
  await requireAdminPage("/admin/parts");
  return (
    <AdminShell active="parts">
      <PartsManager />
    </AdminShell>
  );
}
