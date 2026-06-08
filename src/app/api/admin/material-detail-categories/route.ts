import { NextResponse } from "next/server";
import type { MaterialCategory } from "@/components/admin/operations-types";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED: MaterialCategory[] = ["engin", "camion", "groupe_electrogen"];

function mapRow(r: { id: string; material_category: string; name: string }) {
  return {
    id: r.id,
    materialCategory: r.material_category as MaterialCategory,
    name: r.name,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const category = new URL(request.url).searchParams.get("category");

  let query = getSupabaseAdminClient()
    .from("admin_material_detail_categories")
    .select("id, material_category, name")
    .eq("organization_id", organizationId)
    .order("name");

  if (category && ALLOWED.includes(category as MaterialCategory)) {
    query = query.eq("material_category", category);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapRow));
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as { materialCategory?: MaterialCategory; name?: string };
  const materialCategory = body.materialCategory;
  const name = body.name?.trim() || "";

  if (!materialCategory || !ALLOWED.includes(materialCategory)) {
    return NextResponse.json({ error: "Catégorie matériel invalide" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  const result = await getSupabaseAdminClient()
    .from("admin_material_detail_categories")
    .insert({
      id: opsId("mdcat"),
      user_id: userId,
      organization_id: organizationId,
      material_category: materialCategory,
      name,
    })
    .select("id, material_category, name")
    .single();

  if (result.error) {
    if (result.error.code === "23505") {
      return NextResponse.json({ error: "Cette catégorie existe déjà." }, { status: 400 });
    }
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json(mapRow(result.data));
}
