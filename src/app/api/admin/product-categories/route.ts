import { NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_product_categories")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => ({ id: r.id, name: r.name })));
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as { id?: string; name?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const payload = { name: body.name.trim() };
  const supabase = getSupabaseAdminClient();

  if (body.id?.trim()) {
    const { data: prev } = await supabase
      .from("admin_product_categories")
      .select("name")
      .eq("id", body.id.trim())
      .eq("organization_id", organizationId)
      .single();

    const result = await supabase
      .from("admin_product_categories")
      .update(payload)
      .eq("id", body.id.trim())
      .eq("organization_id", organizationId)
      .select("id, name")
      .single();

    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

    if (prev?.name && prev.name !== payload.name) {
      await supabase
        .from("admin_products")
        .update({ category: payload.name })
        .eq("organization_id", organizationId)
        .eq("category", prev.name);
    }

    return NextResponse.json({ id: result.data.id, name: result.data.name });
  }

  const result = await supabase
    .from("admin_product_categories")
    .insert({ id: opsId("pcat"), user_id: userId, organization_id: organizationId, ...payload })
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

  const supabase = getSupabaseAdminClient();
  const { data: cat } = await supabase
    .from("admin_product_categories")
    .select("name")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  const { error } = await supabase
    .from("admin_product_categories")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (cat?.name) {
    await supabase
      .from("admin_products")
      .update({ category: "" })
      .eq("organization_id", organizationId)
      .eq("category", cat.name);
  }

  return NextResponse.json({ ok: true });
}
