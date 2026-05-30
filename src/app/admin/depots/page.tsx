import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { DepotsManager } from "@/components/admin/DepotsManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Dépôts",
  description: "Gestion des dépôts et entrepôts.",
  robots: { index: false, follow: false },
};

export default async function AdminDepotsPage() {
  await requireAdminPage("/admin/depots");
  return (
    <AdminShell active="depots">
      <DepotsManager />
    </AdminShell>
  );
}
