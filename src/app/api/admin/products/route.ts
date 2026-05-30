import { NextResponse } from "next/server";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapProduct(row: {
  id: string;
  reference: string;
  designation: string;
  category: string | null;
  unit?: string | null;
  unit_price: number;
}) {
  return {
    id: row.id,
    reference: row.reference,
    designation: row.designation,
    category: row.category ?? "",
    unit: (row.unit as string)?.trim() || "u",
    unitPrice: Number(row.unit_price ?? 0),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const category = new URL(request.url).searchParams.get("category");

  let query = getSupabaseAdminClient()
    .from("admin_products")
    .select("id, reference, designation, category, unit, unit_price")
    .eq("organization_id", organizationId)
    .order("designation");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map(mapProduct));
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const body = (await request.json()) as {
    id?: string;
    reference?: string;
    designation?: string;
    category?: string;
    unit?: string;
    unitPrice?: number;
  };

  if (!body.designation?.trim()) {
    return NextResponse.json({ error: "Designation is required" }, { status: 400 });
  }

  const unit = body.unit?.trim() || "";
  if (!unit) {
    return NextResponse.json({ error: "Unité requise" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const payload = {
    reference: body.reference?.trim() || "NN",
    designation: body.designation.trim(),
    category: body.category?.trim() || "",
    unit,
    unit_price: Math.max(0, Number(body.unitPrice) || 0),
  };

  const existingId = body.id?.trim();
  if (existingId) {
    const { data, error } = await supabase
      .from("admin_products")
      .update(payload)
      .eq("id", existingId)
      .eq("organization_id", organizationId)
      .select("id, reference, designation, category, unit, unit_price")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }
    return NextResponse.json(mapProduct(data));
  }

  const { data, error } = await supabase
    .from("admin_products")
    .insert({ id: crypto.randomUUID(), user_id: userId, organization_id: organizationId, ...payload })
    .select("id, reference, designation, category, unit, unit_price")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapProduct(data));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("admin_products")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
