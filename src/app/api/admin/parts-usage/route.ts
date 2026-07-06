import { NextResponse } from "next/server";
import type { PartsUsageType } from "@/components/admin/operations-types";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { partsUsageCsv } from "@/lib/admin/ops-csv-export";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    equipmentId: (r.equipment_id as string) || "",
    equipmentName: r.equipment_name as string,
    stockItemId: (r.stock_item_id as string) || null,
    reference: r.reference as string,
    designation: r.designation as string,
    usageType: r.usage_type as PartsUsageType,
    qty: Number(r.qty ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    usageDate: r.usage_date as string,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_parts_usage")
    .select("*")
    .eq("organization_id", organizationId)
    .order("usage_date", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map(mapRow);

  const exportFormat = new URL(request.url).searchParams.get("format");
  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return partsUsageCsv(rows, parseExportFormat(exportFormat));
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as Record<string, unknown>;
  const supabase = getSupabaseAdminClient();
  const project = await resolveProjectFields(
    supabase,
    organizationId,
    body.projectId as string | undefined,
  );

  const { data, error } = await supabase
    .from("admin_parts_usage")
    .insert({
      id: opsId("part"),
      user_id: userId, organization_id: organizationId,
      project_id: project.project_id,
      equipment_id: (body.equipmentId as string) || null,
      equipment_name: String(body.equipmentName || "").trim(),
      stock_item_id: (body.stockItemId as string) || null,
      reference: String(body.reference || "").trim(),
      designation: String(body.designation || "").trim(),
      usage_type: (body.usageType as PartsUsageType) || "part",
      qty: Number(body.qty) || 0,
      unit_price: Number(body.unitPrice) || 0,
      usage_date: (body.usageDate as string) || new Date().toISOString().slice(0, 10),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapRow(data));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_parts_usage")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
