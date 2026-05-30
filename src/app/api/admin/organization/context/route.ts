import { NextResponse } from "next/server";
import {
  canManageMembers,
  getDefaultOrganizationName,
} from "@/lib/admin/organization";
import { requireAdminContext } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  return NextResponse.json({
    organizationId: auth.organizationId,
    organizationName: getDefaultOrganizationName(),
    role: auth.role,
    canManageMembers: canManageMembers(auth.role),
  });
}
