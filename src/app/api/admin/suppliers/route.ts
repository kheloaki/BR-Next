import { NextResponse } from "next/server";
import {
  mapSupplierRow,
  resolveSupplierNamesFromBody,
  validateSupplierNames,
} from "@/lib/admin/map-supplier";
import { requireAdminContext } from "@/lib/admin/require-admin";
import {
  normalizeSupplyTypes,
  SUPPLIER_SUPPLY_TYPES,
  supplierMatchesSupplyType,
  type SupplierSupplyType,
} from "@/lib/admin/supplier-types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function parseSupplyTypeFilter(value: string | null): SupplierSupplyType | null {
  if (!value?.trim()) return null;
  return SUPPLIER_SUPPLY_TYPES.includes(value as SupplierSupplyType)
    ? (value as SupplierSupplyType)
    : null;
}

const SUPPLIER_SELECT =
  "id, name, supplier_name, company_name, ice, city, address, contact, bank_name, rib, supply_types, organization_id";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const supplyType = parseSupplyTypeFilter(new URL(request.url).searchParams.get("supplyType"));

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_suppliers")
    .select(SUPPLIER_SELECT)
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows = (data ?? []) as Record<string, unknown>[];
  const needsOrgBackfill = rows.some((r) => !r.organization_id);
  if (needsOrgBackfill) {
    await supabase
      .from("admin_suppliers")
      .update({ organization_id: organizationId })
      .is("organization_id", null);
  }

  if (supplyType) {
    rows = rows.filter((r) =>
      supplierMatchesSupplyType(normalizeSupplyTypes(r.supply_types), supplyType),
    );
  }

  return NextResponse.json(rows.map((r) => mapSupplierRow(r)));
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const body = (await request.json()) as {
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

  const { supplierName, companyName, displayName } = resolveSupplierNamesFromBody(body);
  const nameError = validateSupplierNames(supplierName, companyName);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  const supplyTypes =
    body.supplyTypes === undefined
      ? (["divers"] as SupplierSupplyType[])
      : normalizeSupplyTypes(body.supplyTypes);
  if (supplyTypes.length === 0) {
    return NextResponse.json({ error: "Au moins un type d'approvisionnement requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const payload = {
    name: displayName,
    supplier_name: supplierName,
    company_name: companyName,
    ice: body.ice?.trim() || "",
    city: body.city?.trim() || "",
    address: body.address?.trim() || "",
    contact: body.contact?.trim() || "",
    bank_name: body.bankName?.trim() || "",
    rib: body.rib?.trim() || "",
    supply_types: supplyTypes,
  };

  const result = body.id?.trim()
    ? await supabase
        .from("admin_suppliers")
        .update({ ...payload, organization_id: organizationId })
        .eq("id", body.id.trim())
        .select(SUPPLIER_SELECT)
        .single()
    : await supabase
        .from("admin_suppliers")
        .insert({ id: crypto.randomUUID(), user_id: userId, organization_id: organizationId, ...payload })
        .select(SUPPLIER_SELECT)
        .single();

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json(mapSupplierRow(result.data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("admin_suppliers")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
