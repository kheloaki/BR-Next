import { redirect } from "next/navigation";
import { FUEL_TAB_REDIRECT } from "@/lib/admin/fuel-nav";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

/** Redirect /admin/fuel and legacy ?tab= to sub-pages */
export default async function AdminFuelIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; project?: string }>;
}) {
  await requireAdminPage("/admin/fuel");
  const { tab, project } = await searchParams;
  const base = (tab && FUEL_TAB_REDIRECT[tab]) || "/admin/fuel/stock";
  const qs = project ? `?project=${encodeURIComponent(project)}` : "";
  redirect(`${base}${qs}`);
}
