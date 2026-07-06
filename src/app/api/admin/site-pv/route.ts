import { NextResponse } from "next/server";
import type { SitePvStatus, SitePvType } from "@/lib/admin/site-pv-types";
import { SITE_PV_TYPES } from "@/lib/admin/site-pv-types";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { sitePvListCsv } from "@/lib/admin/referential-csv-export";
import { mapSitePvRow } from "@/lib/admin/map-site-pv";
import { nextPvNumber } from "@/lib/admin/pv-number";
import { sitePvPdfBytes, sitePvPdfFilename } from "@/lib/admin/site-pv-pdf";
import { logReportExport } from "@/lib/admin/report-export-log";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const STATUSES: SitePvStatus[] = [
  "draft",
  "sent",
  "signed",
  "accepted",
  "accepted_with_reserves",
  "rejected",
  "archived",
];

async function loadProjectName(supabase: ReturnType<typeof getSupabaseAdminClient>, projectId: string | null) {
  if (!projectId) return undefined;
  const { data } = await supabase.from("admin_projects").select("name").eq("id", projectId).maybeSingle();
  return data?.name as string | undefined;
}

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId, userId } = auth;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const projectId = url.searchParams.get("project");
  const format = url.searchParams.get("format");

  const supabase = getSupabaseAdminClient();

  if (id && format === "pdf") {
    const { data, error } = await supabase
      .from("admin_site_pv")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "PV introuvable" }, { status: 404 });
    const pv = mapSitePvRow(data as Record<string, unknown>);
    const projectName = await loadProjectName(supabase, pv.projectId);
    const filename = sitePvPdfFilename(pv.number);
    void logReportExport({
      organizationId,
      projectId: pv.projectId,
      reportKind: "pv",
      reportModule: pv.pvType,
      reportFormat: "pdf",
      periodFrom: pv.pvDate,
      periodTo: pv.pvDate,
      filename,
      generatedBy: userId,
    });
    const bytes = sitePvPdfBytes(pv, projectName);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  let query = supabase
    .from("admin_site_pv")
    .select("*")
    .eq("organization_id", organizationId)
    .order("pv_date", { ascending: false });

  if (projectId) query = query.eq("project_id", projectId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((r) => mapSitePvRow(r as Record<string, unknown>));
  if (format === "csv" || format === "excel" || format === "xls") {
    return sitePvListCsv(rows, {
      projectId: projectId ?? undefined,
      format: parseExportFormat(format),
    });
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const body = (await request.json()) as {
    id?: string;
    projectId?: string | null;
    pvType?: SitePvType;
    status?: SitePvStatus;
    pvDate?: string;
    object?: string;
    observations?: string;
    decisions?: string;
    reserves?: string;
    participants?: unknown[];
    actions?: unknown[];
    responsiblePerson?: string;
    deadline?: string | null;
    signatures?: unknown[];
  };

  const pvType = body.pvType && SITE_PV_TYPES.includes(body.pvType) ? body.pvType : "reunion_chantier";
  const status = body.status && STATUSES.includes(body.status) ? body.status : "draft";

  const payload = {
    project_id: body.projectId?.trim() || null,
    pv_type: pvType,
    status,
    pv_date: body.pvDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    object: body.object?.trim() || "",
    observations: body.observations?.trim() || "",
    decisions: body.decisions?.trim() || "",
    reserves: body.reserves?.trim() || "",
    participants: body.participants ?? [],
    actions: body.actions ?? [],
    responsible_person: body.responsiblePerson?.trim() || "",
    deadline: body.deadline?.slice(0, 10) || null,
    signatures: body.signatures ?? [],
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const editId = body.id?.trim();

  if (editId) {
    const { data, error } = await supabase
      .from("admin_site_pv")
      .update(payload)
      .eq("id", editId)
      .eq("organization_id", organizationId)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(mapSitePvRow(data as Record<string, unknown>));
  }

  const id = opsId("pv");
  const number = await nextPvNumber(organizationId);
  const { data, error } = await supabase
    .from("admin_site_pv")
    .insert({
      id,
      organization_id: organizationId,
      number,
      created_by: userId,
      ...payload,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapSitePvRow(data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_site_pv")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
