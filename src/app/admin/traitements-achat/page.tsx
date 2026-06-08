import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TraitementManager } from "@/components/admin/TraitementManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export default async function TraitementAchatPage() {
  await requireAdminPage("/admin/traitements-achat");
  return (
    <AdminShell active="traitements-achat">
      <Suspense>
        <TraitementManager kind="achat" />
      </Suspense>
    </AdminShell>
  );
}
