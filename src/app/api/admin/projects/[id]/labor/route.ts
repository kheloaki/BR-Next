import { NextResponse } from "next/server";
import { canViewReports } from "@/lib/admin/organization";
import { mapLaborPayload } from "@/lib/admin/project-dashboard";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapLaborResponse(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    employeeId: (r.employee_id as string) || null,
    employeeName: (r.employee_name as string) || "",
    workDate: r.work_date as string,
    daysWorked: Number(r.days_worked ?? 0),
    dailyRate: Number(r.daily_rate ?? 0),
    amount: Number(r.amount ?? 0),
    notes: (r.notes as string) || "",
  };
}

async function assertProject(supabase: ReturnType<typeof getSupabaseAdminClient>, organizationId: string, projectId: string) {
  const { data } = await supabase
    .from("admin_projects")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();
  return Boolean(data);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  if (!canViewReports(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("admin_project_labor_entries")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("project_id", projectId)
    .order("work_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => mapLaborResponse(r as Record<string, unknown>)));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  if (!canViewReports(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const supabase = getSupabaseAdminClient();
  if (!(await assertProject(supabase, auth.organizationId, projectId))) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const payload = mapLaborPayload(body, projectId);
  if (!payload.employee_name) {
    return NextResponse.json({ error: "Nom ouvrier requis" }, { status: 400 });
  }
  if (payload.days_worked <= 0) {
    return NextResponse.json({ error: "Jours travaillés requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("admin_project_labor_entries")
    .insert({
      id: opsId("plab"),
      user_id: auth.userId,
      organization_id: auth.organizationId,
      ...payload,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapLaborResponse(data as Record<string, unknown>));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  if (!canViewReports(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const body = (await request.json()) as Record<string, unknown> & { id?: string };
  const entryId = body.id?.trim();
  if (!entryId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const payload = mapLaborPayload(body, projectId);

  const { data, error } = await supabase
    .from("admin_project_labor_entries")
    .update(payload)
    .eq("id", entryId)
    .eq("organization_id", auth.organizationId)
    .eq("project_id", projectId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Entrée introuvable" }, { status: 404 });
  return NextResponse.json(mapLaborResponse(data as Record<string, unknown>));
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  if (!canViewReports(auth.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id: projectId } = await params;
  const entryId = new URL(request.url).searchParams.get("id");
  if (!entryId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("admin_project_labor_entries")
    .delete()
    .eq("id", entryId)
    .eq("organization_id", auth.organizationId)
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
