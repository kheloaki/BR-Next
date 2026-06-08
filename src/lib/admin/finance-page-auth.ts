import { redirect } from "next/navigation";
import { canAccessFinance } from "@/lib/admin/finance-permissions";
import { resolveAdminOrganizationForUser } from "@/lib/admin/organization";
import { requireAdminPage } from "@/lib/admin/admin-page-auth";

export async function requireFinancePage(redirectPath: string): Promise<string> {
  const userId = await requireAdminPage(redirectPath);
  const org = await resolveAdminOrganizationForUser(userId);
  if (!canAccessFinance(org.role)) {
    redirect("/admin?finance=forbidden");
  }
  return userId;
}
