import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { loadFuelJournal } from "@/lib/admin/fuel-bon-sync";
import { buildMaterialUsageSummary } from "@/lib/admin/material-fuel-usage";
import { mapRentalContractRow } from "@/lib/admin/map-rental-material";
import { mapRentalMaterialRow } from "@/lib/admin/map-rental-material-catalog";
import { materialConsumptionCsv } from "@/lib/admin/ops-csv-export";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.slice(0, 10) || undefined;
  const to = searchParams.get("to")?.slice(0, 10) || undefined;
  const exportFormat = searchParams.get("format");

  const supabase = getSupabaseAdminClient();
  const [fuelRows, rentalsRes, materialsRes] = await Promise.all([
    loadFuelJournal(supabase, organizationId, 500),
    supabase
      .from("admin_rental_contracts")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("admin_rental_materials")
      .select("*")
      .eq("organization_id", organizationId),
  ]);

  if (rentalsRes.error) {
    return NextResponse.json({ error: rentalsRes.error.message }, { status: 500 });
  }
  if (materialsRes.error) {
    return NextResponse.json({ error: materialsRes.error.message }, { status: 500 });
  }

  const rentals = (rentalsRes.data ?? []).map((r) => mapRentalContractRow(r as Record<string, unknown>));
  const materials = (materialsRes.data ?? []).map((r) => mapRentalMaterialRow(r as Record<string, unknown>));
  const summary = buildMaterialUsageSummary(fuelRows, rentals, materials, { dateFrom: from, dateTo: to });

  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return materialConsumptionCsv(summary.rows, {
      from,
      to,
      format: parseExportFormat(exportFormat),
    });
  }

  return NextResponse.json(summary);
}
