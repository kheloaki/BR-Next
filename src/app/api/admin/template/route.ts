import { NextResponse } from "next/server";
import type { DevisTemplate } from "@/components/admin/devis-types";
import { defaultTemplate } from "@/components/admin/devis-types";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_templates")
    .select("payload")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data?.payload as DevisTemplate | null) ?? defaultTemplate);
}

export async function PUT(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const template = (await request.json()) as DevisTemplate;
  if (!template?.sellerName) {
    return NextResponse.json({ error: "Invalid template payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("admin_templates").upsert(
    {
      user_id: userId,
      organization_id: organizationId,
      payload: template,
    },
    { onConflict: "organization_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
