import { NextResponse } from "next/server";
import type { MaterialCategory } from "@/components/admin/operations-types";
import { mapRentalMaterialRow, type RentalMaterialBody } from "@/lib/admin/map-rental-material-catalog";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_rental_materials")
    .select("*")
    .eq("organization_id", organizationId)
    .order("designation");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r) => mapRentalMaterialRow(r as Record<string, unknown>)));
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as RentalMaterialBody;

  const cat = (body.materialCategory || "engin") as MaterialCategory;
  const designation = body.designation?.trim() || "";
  if (!designation && cat !== "engin") {
    return NextResponse.json({ error: "Désignation requise" }, { status: 400 });
  }
  if (cat === "engin" && !designation && !body.reference?.trim()) {
    return NextResponse.json({ error: "Référence ou désignation requise" }, { status: 400 });
  }
  if ((cat === "camion" || cat === "voiture") && !body.matricule?.trim()) {
    return NextResponse.json({ error: "Matricule requis" }, { status: 400 });
  }

  const payload = {
    material_category: cat,
    reference: body.reference?.trim() || "",
    matricule: body.matricule?.trim() || "",
    designation: designation || body.reference?.trim() || body.matricule?.trim() || "",
    sub_category: body.subCategory?.trim() || "",
    owner_name: body.ownerName?.trim() || "",
    active: body.active !== false,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const result = body.id?.trim()
    ? await supabase
        .from("admin_rental_materials")
        .update(payload)
        .eq("id", body.id.trim())
        .eq("organization_id", organizationId)
        .select("*")
        .single()
    : await supabase
        .from("admin_rental_materials")
        .insert({
          id: opsId("rmat"),
          user_id: userId,
          organization_id: organizationId,
          ...payload,
        })
        .select("*")
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(mapRentalMaterialRow(result.data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_rental_materials")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
