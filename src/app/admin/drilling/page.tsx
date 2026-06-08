import type { Metadata } from "next";
import { AdminComingSoonPanel } from "@/components/admin/AdminComingSoonPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Rapport foration",
  robots: { index: false, follow: false },
};

export default async function AdminDrillingPage() {
  await requireAdminPage("/admin/drilling");
  return (
    <AdminShell active="drilling">
      <AdminComingSoonPanel title="Rapport foration" />
    </AdminShell>
  );
}
