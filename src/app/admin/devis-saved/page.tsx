import { redirect } from "next/navigation";
import { facturationDocumentsPath, parseDocumentsFilterParam } from "@/lib/admin/facturation-nav";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

/** Redirect legacy /admin/devis-saved */
export default async function DevisSavedLegacyPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdminPage("/admin/devis-saved");
  const { filter } = await searchParams;
  const docFilter = parseDocumentsFilterParam(filter);
  redirect(facturationDocumentsPath(docFilter === "all" ? undefined : docFilter));
}
