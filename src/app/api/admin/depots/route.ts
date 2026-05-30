import { NextResponse } from "next/server";
import type { DepotType } from "@/components/admin/operations-types";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const TYPES: DepotType[] = ["central", "site", "other"];

function mapRow(r: Record<string, unknown>, projectName?: string) {
  const depotType = r.depot_type as string;
  return {
    id: r.id as string,
    name: r.name as string,
    address: (r.address as string) || "",
    depotType: TYPES.includes(depotType as DepotType) ? (depotType as DepotType) : "central",
    projectId: (r.project_id as string) || null,
    projectName,
  };
}

export async function GET() {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_depots")
    .select("*, admin_projects(name)")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) {
    const fallback = await supabase.from("admin_depots").select("*").eq("organization_id", organizationId).order("name");
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    return NextResponse.json((fallback.data ?? []).map((r) => mapRow(r)));
  }

  return NextResponse.json(
    (data ?? []).map((r) => {
      const proj = r.admin_projects as { name?: string } | null;
      return mapRow(r, proj?.name);
    }),
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    id?: string;
    name?: string;
    address?: string;
    depotType?: DepotType;
    projectId?: string | null;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom du dépôt requis" }, { status: 400 });
  }

  const depotType = body.depotType && TYPES.includes(body.depotType) ? body.depotType : "central";
  const payload = {
    name: body.name.trim(),
    address: body.address?.trim() || "",
    depot_type: depotType,
    project_id: body.projectId?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const id = body.id?.trim();
  const result = id
    ? await supabase.from("admin_depots").update(payload).eq("id", id).eq("organization_id", organizationId).select("*").single()
    : await supabase
        .from("admin_depots")
        .insert({ id: opsId("dep"), user_id: userId, organization_id: organizationId, ...payload })
        .select("*")
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(mapRow(result.data));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_depots")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
