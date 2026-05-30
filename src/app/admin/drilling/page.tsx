import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DrillingManager } from "@/components/admin/DrillingManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Rapport foration",
  robots: { index: false, follow: false },
};

export default async function AdminDrillingPage() {
  await requireAdminPage("/admin/drilling");
  return (
    <AdminShell active="drilling">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <DrillingManager />
      </Suspense>
    </AdminShell>
  );
}
