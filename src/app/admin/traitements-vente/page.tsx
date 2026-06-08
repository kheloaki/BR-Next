import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TraitementManager } from "@/components/admin/TraitementManager";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export default async function TraitementVentePage() {
  await requireAdminPage("/admin/traitements-vente");
  return (
    <AdminShell active="traitements-vente">
      <Suspense>
        <TraitementManager kind="vente" />
      </Suspense>
    </AdminShell>
  );
}
