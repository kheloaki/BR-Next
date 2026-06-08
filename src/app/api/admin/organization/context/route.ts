import { NextResponse } from "next/server";
import {
  canManageMembers,
  canExportReports,
  canManageReportTemplates,
  canSeeFinancialTotals,
  canSignPv,
  canViewReports,
  getDefaultOrganizationName,
} from "@/lib/admin/organization";
import {
  canAccessFinance,
  canCloseCaisse,
  canCreateMovement,
  canExportFinance,
  canManageFinance,
  canVoidMovement,
  canViewProfitability,
} from "@/lib/admin/finance-permissions";
import { requireAdminContext } from "@/lib/admin/require-admin";

export async function GET() {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;

  return NextResponse.json({
    userId: auth.userId,
    organizationId: auth.organizationId,
    organizationName: getDefaultOrganizationName(),
    role: auth.role,
    canManageMembers: canManageMembers(auth.role),
    canViewReports: canViewReports(auth.role),
    canExportReports: canExportReports(auth.role),
    canSeeFinancialTotals: canSeeFinancialTotals(auth.role),
    canManageReportTemplates: canManageReportTemplates(auth.role),
    canSignPv: canSignPv(auth.role),
    canAccessFinance: canAccessFinance(auth.role),
    canManageFinance: canManageFinance(auth.role),
    canCreateMovement: canCreateMovement(auth.role),
    canVoidMovement: canVoidMovement(auth.role),
    canCloseCaisse: canCloseCaisse(auth.role),
    canViewProfitability: canViewProfitability(auth.role),
    canExportFinance: canExportFinance(auth.role),
  });
}
