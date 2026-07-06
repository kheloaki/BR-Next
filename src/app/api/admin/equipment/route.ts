import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { equipmentCsv } from "@/lib/admin/referential-csv-export";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_equipment")
    .select("id, name, type, active")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    active: Boolean(r.active),
  }));
  const exportFormat = new URL(request.url).searchParams.get("format");
  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return equipmentCsv(rows, parseExportFormat(exportFormat));
  }
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    id?: string;
    name?: string;
    type?: string;
    active?: boolean;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const payload = {
    name: body.name.trim(),
    type: body.type?.trim() || "",
    active: body.active !== false,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const result = body.id?.trim()
    ? await supabase
        .from("admin_equipment")
        .update(payload)
        .eq("id", body.id.trim())
        .eq("organization_id", organizationId)
        .select("id, name, type, active")
        .single()
    : await supabase
        .from("admin_equipment")
        .insert({ id: opsId("eq"), user_id: userId, organization_id: organizationId, ...payload })
        .select("id, name, type, active")
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  const r = result.data;
  return NextResponse.json({
    id: r.id,
    name: r.name,
    type: r.type,
    active: Boolean(r.active),
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_equipment")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
