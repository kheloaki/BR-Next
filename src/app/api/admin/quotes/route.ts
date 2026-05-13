import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { QuoteDraft } from "@/components/admin/devis-types";
import { ensureAdminUserRow, getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

  const supabase = getSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await supabase
      .from("admin_quotes")
      .select("id, payload, created_at")
      .eq("user_id", userId)
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
    .eq("user_id", userId)
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

  return NextResponse.json(quotes);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureAdminUserRow(userId);

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
    .eq("user_id", userId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase
      .from("admin_quotes")
      .update({ payload })
      .eq("id", quoteId)
      .eq("user_id", userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id: quoteId, updated: true });
  }

  const { error } = await supabase.from("admin_quotes").insert({
    id: quoteId,
    user_id: userId,
    payload,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: quoteId, created: true });
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
    .from("admin_quotes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
