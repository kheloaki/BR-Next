import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TraitementManager } from "@/components/admin/TraitementManager";
import { TraitementsPageSkeleton } from "@/components/admin/skeletons/pages";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export default async function TraitementsPage() {
  await requireAdminPage("/admin/traitements");
  return (
    <AdminShell active="traitements">
      <Suspense fallback={<TraitementsPageSkeleton />}>
        <TraitementManager />
      </Suspense>
    </AdminShell>
  );
}
