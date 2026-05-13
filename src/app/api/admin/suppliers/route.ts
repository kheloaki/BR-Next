import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureAdminUserRow, getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_suppliers")
    .select("id, name, ice, city, address, contact")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    ice?: string;
    city?: string;
    address?: string;
    contact?: string;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const payload = {
    name: body.name.trim(),
    ice: body.ice?.trim() || "",
    city: body.city?.trim() || "",
    address: body.address?.trim() || "",
    contact: body.contact?.trim() || "",
  };

  const result = body.id?.trim()
    ? await supabase
        .from("admin_suppliers")
        .update(payload)
        .eq("id", body.id.trim())
        .eq("user_id", userId)
        .select("id, name, ice, city, address, contact")
        .single()
    : await supabase
        .from("admin_suppliers")
        .insert({ id: crypto.randomUUID(), user_id: userId, ...payload })
        .select("id, name, ice, city, address, contact")
        .single();

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json(result.data);
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
    .from("admin_suppliers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
