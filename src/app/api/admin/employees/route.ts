import { NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const SELECT = "id, matricule, name, role, default_project_id";

export async function GET() {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

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

  return NextResponse.json(
    (data ?? []).map((r) => ({
      id: r.id,
      matricule: r.matricule,
      name: r.name,
      role: r.role,
      defaultProjectId: (r.default_project_id as string) || null,
      defaultProjectName: r.default_project_id
        ? projectNames.get(r.default_project_id as string) || ""
        : "",
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    id?: string;
    matricule?: string;
    name?: string;
    role?: string;
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

  const payload = {
    matricule: body.matricule?.trim() || "",
    name: body.name.trim(),
    role: body.role?.trim() || "",
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

  let defaultProjectName = "";
  if (r.default_project_id) {
    const { data: p } = await supabase
      .from("admin_projects")
      .select("name")
      .eq("id", r.default_project_id)
      .maybeSingle();
    defaultProjectName = (p?.name as string) || "";
  }

  return NextResponse.json({
    id: r.id,
    matricule: r.matricule,
    name: r.name,
    role: r.role,
    defaultProjectId: (r.default_project_id as string) || null,
    defaultProjectName,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
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
