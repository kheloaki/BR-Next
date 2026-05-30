import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

/** Legacy URL — engins and personnel are now separate pages. */
export default async function AdminReferentielRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdminPage("/admin/referentiel");
  const { tab } = await searchParams;
  redirect(tab === "employees" ? "/admin/personnel" : "/admin/equipment-rental/materials");
}
