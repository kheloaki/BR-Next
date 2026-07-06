import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { employeesCsv } from "@/lib/admin/referential-csv-export";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const SELECT = "id, cin, name, role, address, birth_date, default_project_id";

function mapEmployeeRow(
  r: Record<string, unknown>,
  projectNames: Map<string, string>,
) {
  const projectId = (r.default_project_id as string) || null;
  return {
    id: r.id as string,
    cin: (r.cin as string) || "",
    name: r.name as string,
    role: (r.role as string) || "",
    address: (r.address as string) || "",
    birthDate: r.birth_date ? String(r.birth_date).slice(0, 10) : null,
    defaultProjectId: projectId,
    defaultProjectName: projectId ? projectNames.get(projectId) || "" : "",
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_employees")
    .select(SELECT)
    .eq("organization_id", organizationId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const projectIds = [...new Set((data ?? []).map((r) => r.default_project_id).filter(Boolean))] as string[];
  const projectNames = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("admin_projects")
      .select("id, name")
      .eq("organization_id", organizationId)
      .in("id", projectIds);
    for (const p of projects ?? []) {
      projectNames.set(p.id as string, p.name as string);
    }
  }

  const rows = (data ?? []).map((r) => mapEmployeeRow(r, projectNames));
  const exportFormat = new URL(request.url).searchParams.get("format");
  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return employeesCsv(rows, parseExportFormat(exportFormat));
  }
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    id?: string;
    cin?: string;
    name?: string;
    role?: string;
    address?: string;
    birthDate?: string | null;
    defaultProjectId?: string | null;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const projectId = body.defaultProjectId?.trim() || null;
  if (projectId) {
    const { data: project } = await getSupabaseAdminClient()
      .from("admin_projects")
      .select("id")
      .eq("id", projectId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 400 });
    }
  }

  const birthRaw = body.birthDate?.trim();
  const payload = {
    cin: body.cin?.trim() || "",
    name: body.name.trim(),
    role: body.role?.trim() || "",
    address: body.address?.trim() || "",
    birth_date: birthRaw || null,
    default_project_id: projectId,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const result = body.id?.trim()
    ? await supabase
        .from("admin_employees")
        .update(payload)
        .eq("id", body.id.trim())
        .eq("organization_id", organizationId)
        .select(SELECT)
        .single()
    : await supabase
        .from("admin_employees")
        .insert({ id: opsId("emp"), user_id: userId, organization_id: organizationId, ...payload })
        .select(SELECT)
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  const r = result.data;

  const projectNames = new Map<string, string>();
  if (r.default_project_id) {
    const { data: p } = await supabase
      .from("admin_projects")
      .select("name")
      .eq("id", r.default_project_id)
      .maybeSingle();
    if (p?.name) projectNames.set(r.default_project_id as string, p.name as string);
  }

  return NextResponse.json(mapEmployeeRow(r, projectNames));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_employees")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
