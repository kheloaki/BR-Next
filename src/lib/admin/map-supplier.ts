import type { Supplier } from "@/components/admin/devis-types";
import { normalizeSupplyTypes, type SupplierSupplyType } from "@/lib/admin/supplier-types";

/** Libellé affiché — nom fournisseur, société, ou les deux. */
export function formatSupplierDisplayName(
  supplierName?: string | null,
  companyName?: string | null,
  fallbackName?: string | null,
): string {
  const sn = (supplierName ?? "").trim();
  const cn = (companyName ?? "").trim();
  if (sn && cn) return `${sn} — ${cn}`;
  if (sn) return sn;
  if (cn) return cn;
  return (fallbackName ?? "").trim();
}

export function validateSupplierNames(supplierName?: string, companyName?: string): string | null {
  if (!(supplierName?.trim() || companyName?.trim())) {
    return "Indiquez le nom du fournisseur et/ou la société.";
  }
  return null;
}

export function mapSupplierRow(r: Record<string, unknown>): Supplier {
  let supplierName = (r.supplier_name as string) || "";
  let companyName = (r.company_name as string) || "";
  const legacyName = (r.name as string) || "";
  if (!supplierName && !companyName && legacyName) {
    supplierName = legacyName;
  }
  return {
    id: r.id as string,
    name: formatSupplierDisplayName(supplierName, companyName, legacyName),
    supplierName,
    companyName,
    ice: (r.ice as string) || "",
    city: (r.city as string) || "",
    address: (r.address as string) || "",
    contact: (r.contact as string) || "",
    bankName: (r.bank_name as string) || "",
    rib: (r.rib as string) || "",
    supplyTypes: normalizeSupplyTypes(r.supply_types),
  };
}

export type SupplierBody = {
  id?: string;
  name?: string;
  supplierName?: string;
  companyName?: string;
  ice?: string;
  city?: string;
  address?: string;
  contact?: string;
  bankName?: string;
  rib?: string;
  supplyTypes?: SupplierSupplyType[];
};

export function resolveSupplierNamesFromBody(body: SupplierBody) {
  const supplierName = body.supplierName?.trim() ?? "";
  const companyName = body.companyName?.trim() ?? body.name?.trim() ?? "";
  const displayName = formatSupplierDisplayName(supplierName, companyName);
  return { supplierName, companyName, displayName };
}
