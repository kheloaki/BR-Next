import { redirect } from "next/navigation";
import {
  documentTypeFromLegacyParam,
  facturationBuilderPath,
} from "@/lib/admin/facturation-nav";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

/** Redirect legacy /admin/devis-builder to facturation sub-pages */
export default async function DevisBuilderLegacyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; type?: string }>;
}) {
  await requireAdminPage("/admin/devis-builder");
  const { id, type } = await searchParams;
  const docType = documentTypeFromLegacyParam(type) ?? "devis";
  const base = facturationBuilderPath(docType);
  const qs = new URLSearchParams();
  if (id) qs.set("id", id);
  redirect(qs.toString() ? `${base}?${qs}` : base);
}
