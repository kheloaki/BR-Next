import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DEFAULT_PRODUCTS } from "@/components/admin/devis-types";
import { ensureAdminUserRow, getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_products")
    .select("id, reference, designation, unit_price")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    const seedRows = DEFAULT_PRODUCTS.map((item) => ({
      id: crypto.randomUUID(),
      user_id: userId,
      reference: item.reference,
      designation: item.designation,
      unit_price: item.unitPrice,
    }));
    const seeded = await supabase
      .from("admin_products")
      .insert(seedRows)
      .select("id, reference, designation, unit_price");
    if (seeded.error) {
      return NextResponse.json({ error: seeded.error.message }, { status: 500 });
    }
    return NextResponse.json(
      (seeded.data ?? []).map((row) => ({
        id: row.id,
        reference: row.reference,
        designation: row.designation,
        unitPrice: Number(row.unit_price ?? 0),
      })),
    );
  }

  return NextResponse.json(
    data.map((row) => ({
      id: row.id,
      reference: row.reference,
      designation: row.designation,
      unitPrice: Number(row.unit_price ?? 0),
    })),
  );
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

  const body = (await request.json()) as {
    id?: string;
    reference?: string;
    designation?: string;
    unitPrice?: number;
  };

  if (!body.designation?.trim()) {
    return NextResponse.json({ error: "Designation is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const payload = {
    reference: body.reference?.trim() || "NN",
    designation: body.designation.trim(),
    unit_price: Math.max(0, Number(body.unitPrice) || 0),
  };

  const result = body.id?.trim()
    ? await supabase
        .from("admin_products")
        .update(payload)
        .eq("id", body.id.trim())
        .eq("user_id", userId)
        .select("id, reference, designation, unit_price")
        .single()
    : await supabase
        .from("admin_products")
        .insert({ id: crypto.randomUUID(), user_id: userId, ...payload })
        .select("id, reference, designation, unit_price")
        .single();

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: result.data.id,
    reference: result.data.reference,
    designation: result.data.designation,
    unitPrice: Number(result.data.unit_price ?? 0),
  });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

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
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
