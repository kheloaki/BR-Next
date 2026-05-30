import { NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

/** @deprecated Use /api/admin/projects — returns id+name for legacy dropdowns */
export async function GET() {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_projects")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as { id?: string; name?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const payload = { name: body.name.trim(), updated_at: new Date().toISOString() };
  const supabase = getSupabaseAdminClient();
  const result = body.id?.trim()
    ? await supabase
        .from("admin_projects")
        .update(payload)
        .eq("id", body.id.trim())
        .eq("organization_id", organizationId)
        .select("id, name")
        .single()
    : await supabase
        .from("admin_projects")
        .insert({ id: opsId("prj"), user_id: userId, organization_id: organizationId, status: "active", ...payload })
        .select("id, name")
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ id: result.data.id, name: result.data.name });
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
