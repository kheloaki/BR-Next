import { NextResponse } from "next/server";
import type { QuoteDraft } from "@/components/admin/devis-types";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const supabase = getSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await supabase
      .from("admin_quotes")
      .select("id, payload, created_at")
      .eq("organization_id", organizationId)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const payload = data.payload as QuoteDraft;
    return NextResponse.json({
      ...payload,
      id: data.id,
      createdAt: payload.createdAt || data.created_at,
    });
  }

  const { data, error } = await supabase
    .from("admin_quotes")
    .select("id, payload, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const quotes = (data ?? []).map((row) => {
    const payload = row.payload as QuoteDraft;
    return {
      ...payload,
      id: row.id,
      createdAt: payload.createdAt || row.created_at,
    };
  });

  return NextResponse.json(quotes, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Clerk-User-Id": userId,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminContext();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;

  const quote = (await request.json()) as QuoteDraft;
  if (!quote?.clientName || !Array.isArray(quote.items)) {
    return NextResponse.json({ error: "Invalid quote payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const quoteId = quote.id || crypto.randomUUID();
  const payload: QuoteDraft = {
    ...quote,
    id: quoteId,
    createdAt: quote.createdAt || new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await supabase
    .from("admin_quotes")
    .select("id")
    .eq("id", quoteId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase
      .from("admin_quotes")
      .update({ payload })
      .eq("id", quoteId)
      .eq("organization_id", organizationId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: quoteId, updated: true });
  }

  const { error } = await supabase.from("admin_quotes").insert({
    id: quoteId,
    user_id: userId,
    organization_id: organizationId,
    payload,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: quoteId, created: true });
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
    .from("admin_quotes")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
