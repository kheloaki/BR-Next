import { NextResponse } from "next/server";
import { assertFinanceAccess } from "@/lib/admin/finance-permissions";
import { ensureFinanceCategories, mapFinanceCategory } from "@/lib/admin/finance-server";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  await ensureFinanceCategories(auth.organizationId);

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_finance_categories")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((row) => mapFinanceCategory(row as Record<string, unknown>)));
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const denied = assertFinanceAccess(auth.role);
  if (denied) return denied;

  const body = (await request.json()) as { name?: string; slug?: string; direction?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  const slug =
    body.slug?.trim() ||
    body.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  const direction =
    body.direction === "income" || body.direction === "expense" ? body.direction : "both";

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_finance_categories")
    .insert({
      id: `fcat-${crypto.randomUUID()}`,
      organization_id: auth.organizationId,
      name: body.name.trim(),
      slug,
      direction,
      is_system: false,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapFinanceCategory(data as Record<string, unknown>));
}
