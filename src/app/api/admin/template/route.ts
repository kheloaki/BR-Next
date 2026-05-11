import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { DevisTemplate } from "@/components/admin/devis-types";
import { defaultTemplate } from "@/components/admin/devis-types";
import { ensureAdminUserRow, getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_templates")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data?.payload as DevisTemplate | null) ?? defaultTemplate);
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

  const template = (await request.json()) as DevisTemplate;
  if (!template?.sellerName) {
    return NextResponse.json({ error: "Invalid template payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("admin_templates").upsert(
    {
      user_id: userId,
      payload: template,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
