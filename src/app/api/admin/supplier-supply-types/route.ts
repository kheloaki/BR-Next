import { NextResponse } from "next/server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import {
  BUILTIN_SUPPLY_TYPE_OPTIONS,
  mergeSupplyTypeOptions,
  slugifySupplyTypeLabel,
  type SupplierSupplyTypeOption,
} from "@/lib/admin/supplier-supply-type-catalog";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapRow(r: Record<string, unknown>): SupplierSupplyTypeOption {
  return {
    slug: String(r.slug ?? ""),
    label: String(r.label ?? ""),
    isSystem: false,
  };
}

async function loadCustomTypes(organizationId: string) {
  const { data, error } = await getSupabaseAdminClient()
    .from("admin_supplier_supply_types")
    .select("slug, label")
    .eq("organization_id", organizationId)
    .order("label");

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

async function resolveUniqueSlug(organizationId: string, label: string) {
  const custom = await loadCustomTypes(organizationId);
  const existing = new Set([
    ...BUILTIN_SUPPLY_TYPE_OPTIONS.map((o) => o.slug),
    ...custom.map((o) => o.slug),
  ]);

  let slug = slugifySupplyTypeLabel(label);
  if (!existing.has(slug)) return slug;

  let i = 2;
  while (existing.has(`${slug}_${i}`)) i += 1;
  return `${slug}_${i}`;
}

export async function GET() {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  try {
    const custom = await loadCustomTypes(organizationId);
    return NextResponse.json(mergeSupplyTypeOptions(custom));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur chargement types" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as { label?: string };

  const label = body.label?.trim() ?? "";
  if (!label) {
    return NextResponse.json({ error: "Nom du type requis" }, { status: 400 });
  }

  const slug = await resolveUniqueSlug(organizationId, label);
  const supabase = getSupabaseAdminClient();

  const result = await supabase
    .from("admin_supplier_supply_types")
    .insert({
      id: opsId("sst"),
      user_id: userId,
      organization_id: organizationId,
      slug,
      label,
    })
    .select("slug, label")
    .single();

  if (result.error) {
    if (result.error.code === "23505") {
      return NextResponse.json({ error: "Ce type existe déjà." }, { status: 400 });
    }
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const custom = await loadCustomTypes(organizationId);
  return NextResponse.json({
    created: mapRow(result.data as Record<string, unknown>),
    options: mergeSupplyTypeOptions(custom),
  });
}
