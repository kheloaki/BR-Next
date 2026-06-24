import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { SavedDevisList } from "@/components/admin/SavedDevisList";
import { SavedDevisListSkeleton } from "@/components/admin/skeletons/pages";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export const metadata: Metadata = {
  title: "Documents enregistrés",
  robots: { index: false, follow: false },
};

export default async function FacturationDocumentsPage() {
  await requireAdminPage("/admin/facturation/documents");
  return (
    <AdminShell active="saved">
      <Suspense fallback={<SavedDevisListSkeleton />}>
        <SavedDevisList />
      </Suspense>
    </AdminShell>
  );
}
