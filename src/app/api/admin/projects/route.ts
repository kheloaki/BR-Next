import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { buildAdminProjectPayload, mapAdminProjectRow } from "@/lib/admin/map-project";
import { projectsCsv } from "@/lib/admin/referential-csv-export";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProjectStatus } from "@/components/admin/operations-types";

const STATUSES: ProjectStatus[] = ["active", "inactive"];

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = getSupabaseAdminClient()
    .from("admin_projects")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");

  if (status && STATUSES.includes(status as ProjectStatus)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const projects = (data ?? []).map((r) => mapAdminProjectRow(r as Record<string, unknown>));

  const financials = searchParams.get("financials") === "1";
  const exportFormat = searchParams.get("format");
  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return projectsCsv(projects, {
      status: status ?? undefined,
      format: parseExportFormat(exportFormat),
    });
  }
  if (!financials || projects.length === 0) {
    return NextResponse.json(projects);
  }

  const supabase = getSupabaseAdminClient();
  const { fetchProjectFinancialSummaries } = await import("@/lib/admin/project-dashboard");
  const summaries = await fetchProjectFinancialSummaries(
    supabase,
    organizationId,
    projects.map((p) => p.id),
  );
  const summaryById = new Map(summaries.map((s) => [s.projectId, s]));

  return NextResponse.json(
    projects.map((p) => ({
      ...p,
      financials: summaryById.get(p.id) ?? {
        projectId: p.id,
        budgetMad: p.budgetMad,
        montantPaye: 0,
        resteARecevoir: p.budgetMad,
        totalCostMad: 0,
        margeMad: 0,
      },
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as Record<string, unknown>;
  const payload = buildAdminProjectPayload(body);

  if (!payload.name) {
    const autoName = [payload.code, payload.client_name].filter(Boolean).join(" — ");
    if (autoName) payload.name = autoName;
  }
  if (!payload.name) {
    return NextResponse.json({ error: "Réf. projet ou intitulé requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const id = String(body.id || "").trim();
  const result = id
    ? await supabase.from("admin_projects").update(payload).eq("id", id).eq("organization_id", organizationId).select("*").single()
    : await supabase
        .from("admin_projects")
        .insert({ id: opsId("prj"), user_id: userId, organization_id: organizationId, ...payload })
        .select("*")
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  if (id && payload.name) {
    const label = { site_name: payload.name };
    const tables = [
      "admin_fuel_entries",
      "admin_drilling_reports",
      "admin_production_entries",
      "admin_attendance",
      "admin_stock_movements",
    ] as const;
    for (const table of tables) {
      await supabase.from(table).update(label).eq("project_id", id).eq("organization_id", organizationId);
    }
  }

  return NextResponse.json(mapAdminProjectRow(result.data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_projects")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
