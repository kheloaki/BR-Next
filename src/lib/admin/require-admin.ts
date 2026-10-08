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
  try {
    await ensureAdminUserRow(userId);
    const org = await resolveAdminOrganizationForUser(userId);
    return { userId, organizationId: org.organizationId, role: org.role };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin auth failed";
    const transient =
      message.toLowerCase().includes("fetch failed") ||
      message.toLowerCase().includes("supabase");
    return {
      error: NextResponse.json(
        {
          error: transient
            ? "Database temporarily unreachable. Retry in a moment."
            : "Admin authentication failed",
          details: message,
        },
        { status: transient ? 503 : 500 },
      ),
    };
  }
}

/** @deprecated Prefer requireAdminContext — kept for gradual migration. */
export async function requireAdminUserId() {
  const ctx = await requireAdminContext();
  if ("error" in ctx) return ctx;
  return ctx;
}
