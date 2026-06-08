import type { OrganizationRole } from "@/lib/admin/organization";
import { NextResponse } from "next/server";

export type FinanceRole = OrganizationRole | "financier" | "accountant" | "project_manager";

export function canAccessFinance(role: string): boolean {
  return role === "owner" || role === "admin" || role === "financier" || role === "accountant";
}

export function canManageFinance(role: string): boolean {
  return role === "owner" || role === "admin" || role === "financier";
}

export function canCreateMovement(role: string): boolean {
  return canManageFinance(role) || role === "accountant";
}

export function canVoidMovement(role: string): boolean {
  return canManageFinance(role);
}

export function canCloseCaisse(role: string): boolean {
  return canManageFinance(role);
}

export function canViewProfitability(role: string): boolean {
  return canAccessFinance(role) || role === "project_manager";
}

export function canExportFinance(role: string): boolean {
  return canAccessFinance(role);
}

export function canSeeFinancialTotals(role: string): boolean {
  return role === "owner" || role === "admin" || role === "financier" || role === "accountant";
}

export function financeForbiddenResponse() {
  return NextResponse.json({ error: "Accès finance refusé" }, { status: 403 });
}

export function assertFinanceAccess(role: string): NextResponse | null {
  if (!canAccessFinance(role)) return financeForbiddenResponse();
  return null;
}

export function assertFinanceManage(role: string): NextResponse | null {
  if (!canManageFinance(role)) return financeForbiddenResponse();
  return null;
}
