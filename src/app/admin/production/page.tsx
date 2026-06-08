import type { Metadata } from "next";
import { AdminComingSoonPanel } from "@/components/admin/AdminComingSoonPanel";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Production",
  robots: { index: false, follow: false },
};

export default async function AdminProductionPage() {
  await requireAdminPage("/admin/production");
  return (
    <AdminShell active="production">
      <AdminComingSoonPanel title="Production" />
    </AdminShell>
  );
}
