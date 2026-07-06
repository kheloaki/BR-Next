import { NextResponse } from "next/server";
import type { QuoteDraft } from "@/components/admin/devis-types";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { quotesCsv } from "@/lib/admin/referential-csv-export";
import { requireAdminContext } from "@/lib/admin/require-admin";
import { computeNextDocumentNumber, yearFromDate } from "@/lib/admin/document-number";
import { syncTraitementAfterQuoteSave } from "@/lib/admin/traitement-sync-server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function quoteProjectIdColumn(quote: QuoteDraft): string | null {
  const id = quote.projectId?.trim();
  return id || null;
}

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

  const documentType = searchParams.get("documentType");

  const quotes = (data ?? []).map((row) => {
    const payload = row.payload as QuoteDraft;
    return {
      ...payload,
      id: row.id,
      createdAt: payload.createdAt || row.created_at,
    };
  });

  const filtered = documentType
    ? quotes.filter((q) => (q.documentType ?? "devis") === documentType)
    : quotes;

  const exportFormat = searchParams.get("format");
  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return quotesCsv(filtered, {
      documentType: documentType ?? undefined,
      format: parseExportFormat(exportFormat),
    });
  }

  return NextResponse.json(filtered, {
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
  if (!quote?.clientName?.trim() || !Array.isArray(quote.items)) {
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

  if (!existing) {
    const { data: rows, error: listError } = await supabase
      .from("admin_quotes")
      .select("payload")
      .eq("organization_id", organizationId);
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    const allQuotes = (rows ?? []).map((row) => row.payload as QuoteDraft);
    const docType = payload.documentType ?? "devis";
    const year = yearFromDate(payload.date);
    payload.quoteNumber = computeNextDocumentNumber(allQuotes, docType, year);
  }

  if (existing) {
    const { error } = await supabase
      .from("admin_quotes")
      .update({ payload, project_id: quoteProjectIdColumn(payload) })
      .eq("id", quoteId)
      .eq("organization_id", organizationId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    try {
      await syncTraitementAfterQuoteSave(supabase, organizationId, userId, payload, { isCreate: false });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Sync traitement impossible" },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true, id: quoteId, updated: true });
  }

  const { error } = await supabase.from("admin_quotes").insert({
    id: quoteId,
    user_id: userId,
    organization_id: organizationId,
    project_id: quoteProjectIdColumn(payload),
    payload,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const sync = await syncTraitementAfterQuoteSave(supabase, organizationId, userId, payload, {
      isCreate: true,
    });
    return NextResponse.json({ ok: true, id: quoteId, created: true, traitementSync: sync });
  } catch (e) {
    await supabase.from("admin_quotes").delete().eq("id", quoteId).eq("organization_id", organizationId);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync traitement impossible" },
      { status: 400 },
    );
  }
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
