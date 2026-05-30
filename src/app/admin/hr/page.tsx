import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { HRManager } from "@/components/admin/HRManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "RH & pointage",
  robots: { index: false, follow: false },
};

export default async function AdminHRPage() {
  await requireAdminPage("/admin/hr");
  return (
    <AdminShell active="hr">
      <Suspense fallback={<p className="text-sm">Chargement…</p>}>
        <HRManager />
      </Suspense>
    </AdminShell>
  );
}
