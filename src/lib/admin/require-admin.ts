import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { resolveAdminOrganizationForUser, type OrganizationRole } from "@/lib/admin/organization";
import { ensureAdminUserRow } from "@/lib/supabase/admin";

export type AdminAuthContext = {
  userId: string;
  organizationId: string;
  role: OrganizationRole;
};

export async function requireAdminContext(): Promise<AdminAuthContext | { error: NextResponse }> {
  const { userId } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  await ensureAdminUserRow(userId);
  const org = await resolveAdminOrganizationForUser(userId);
  return { userId, organizationId: org.organizationId, role: org.role };
}

/** @deprecated Prefer requireAdminContext — kept for gradual migration. */
export async function requireAdminUserId() {
  const ctx = await requireAdminContext();
  if ("error" in ctx) return ctx;
  return ctx;
}
