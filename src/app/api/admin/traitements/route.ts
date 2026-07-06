import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { traitementsCsv } from "@/lib/admin/ops-csv-export";
import { mapTraitementLine, mapTraitementRow } from "@/lib/admin/map-traitement";
import { nextTraitementNumber } from "@/lib/admin/traitement-number";
import {
  defaultTraitementSteps,
  normalizeTraitementSteps,
  TRAITEMENT_STEP_LABELS,
  type TraitementLineInput,
  type TraitementStatus,
  type TraitementSteps,
  type TraitementSupplyKind,
  type TraitementType,
} from "@/lib/admin/traitement-types";
import { syncTraitementFinanceFromStoredQuote, attachTraitementFinanceSummaries } from "@/lib/admin/traitement-finance-sync";
import { registerTraitementBrStep, registerTraitementGasoilBcStep, registerTraitementGasoilBlStep, syncTraitementAfterQuoteSave } from "@/lib/admin/traitement-sync-server";
import { resolveTraitementLineLinks } from "@/lib/admin/article-inventory";
import { inferTraitementSupplyKind } from "@/lib/admin/traitement-supply-kind";
import { GASOIL_UNIT } from "@/lib/admin/gasoil-stock";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveDepotFields, resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function loadTraitementWithLines(supabase: ReturnType<typeof getSupabaseAdminClient>, id: string, organizationId: string) {
  const { data: row, error } = await supabase
    .from("admin_traitements")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: lineRows, error: lineErr } = await supabase
    .from("admin_traitement_lines")
    .select("*")
    .eq("traitement_id", id)
    .order("sort_order");
  if (lineErr) throw new Error(lineErr.message);

  const supplyKind = (row.supply_kind as TraitementSupplyKind) || "articles";
  return mapTraitementRow(
    row as Record<string, unknown>,
    (lineRows ?? []).map((l) => mapTraitementLine(l as Record<string, unknown>, supplyKind)),
  );
}

async function loadAllTraitements(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  type: TraitementType | null,
) {
  let query = supabase
    .from("admin_traitements")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (type) query = query.eq("traitement_type", type);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length === 0) return [];

  const { data: lineRows, error: lineErr } = await supabase
    .from("admin_traitement_lines")
    .select("*")
    .in("traitement_id", ids)
    .order("sort_order");
  if (lineErr) throw new Error(lineErr.message);

  const supplyKindByTraitement = new Map(
    (data ?? []).map((row) => [row.id as string, ((row.supply_kind as TraitementSupplyKind) || "articles")]),
  );

  const linesByTraitement = new Map<string, ReturnType<typeof mapTraitementLine>[]>();
  for (const line of lineRows ?? []) {
    const tid = line.traitement_id as string;
    const list = linesByTraitement.get(tid) ?? [];
    list.push(mapTraitementLine(line as Record<string, unknown>, supplyKindByTraitement.get(tid)));
    linesByTraitement.set(tid, list);
  }

  return (data ?? []).map((row) =>
    mapTraitementRow(row as Record<string, unknown>, linesByTraitement.get(row.id as string) ?? []),
  );
}

function parseLines(raw: TraitementLineInput[] | undefined): TraitementLineInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((line, index) => ({
      productId: line.productId?.trim() || undefined,
      stockItemId: line.stockItemId?.trim() || undefined,
      reference: line.reference?.trim() || "",
      designation: line.designation?.trim() || "",
      unit: line.unit?.trim() || "PIECE",
      qty: Math.max(0, Number(line.qty) || 0),
      unitPrice: Math.max(0, Number(line.unitPrice) || 0),
      sortOrder: index,
    }))
    .filter((line) => line.designation || line.reference);
}

async function insertLines(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  traitementId: string,
  lines: TraitementLineInput[],
) {
  if (lines.length === 0) return;
  const payload = lines.map((line, index) => ({
    id: opsId("trl"),
    traitement_id: traitementId,
    product_id: line.productId || null,
    stock_item_id: line.stockItemId || null,
    reference: line.reference || "",
    designation: line.designation,
    unit: line.unit || "PIECE",
    qty: line.qty,
    unit_price: line.unitPrice ?? 0,
    sort_order: index,
  }));
  const { error } = await supabase.from("admin_traitement_lines").insert(payload);
  if (error) throw new Error(error.message);
}

async function resolveLinesWithStock(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  userId: string,
  traitementType: TraitementType,
  lines: TraitementLineInput[],
  supplyKind: TraitementSupplyKind = "articles",
) {
  const resolved: TraitementLineInput[] = [];
  for (const line of lines) {
    const links = await resolveTraitementLineLinks(
      supabase,
      organizationId,
      userId,
      line,
      traitementType,
      { supplyKind },
    );
    resolved.push({
      ...line,
      unit: line.unit?.trim() || (supplyKind === "gasoil" ? GASOIL_UNIT : "PIECE"),
      productId: links.productId ?? line.productId,
      stockItemId: links.stockItemId ?? line.stockItemId,
    });
  }
  return resolved;
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const id = searchParams.get("id");
  const type =
    typeParam === "achat" || typeParam === "vente" ? (typeParam as TraitementType) : null;

  const supabase = getSupabaseAdminClient();

  try {
    if (id) {
      const one = await loadTraitementWithLines(supabase, id, organizationId);
      if (!one) return NextResponse.json({ error: "Traitement introuvable" }, { status: 404 });
      return NextResponse.json(one);
    }

    const rows = await loadAllTraitements(supabase, organizationId, type);
    const enriched = await attachTraitementFinanceSummaries(supabase, organizationId, rows, auth.userId);

    const exportFormat = searchParams.get("format");
    if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
      return traitementsCsv(enriched, {
        type,
        format: parseExportFormat(exportFormat),
      });
    }

    return NextResponse.json(enriched);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur chargement" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    traitementType?: TraitementType;
    label?: string;
    projectId?: string;
    depotId?: string;
    supplierId?: string;
    customerId?: string;
    partnerName?: string;
    notes?: string;
    lines?: TraitementLineInput[];
  };

  if (body.traitementType !== "achat" && body.traitementType !== "vente") {
    return NextResponse.json({ error: "Type de traitement requis (achat ou vente)" }, { status: 400 });
  }
  if (!body.label?.trim()) {
    return NextResponse.json({ error: "Objet du traitement requis" }, { status: 400 });
  }

  const lines = parseLines(body.lines);
  if (lines.length === 0) {
    return NextResponse.json({ error: "Ajoutez au moins un article" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  let supplyKind: TraitementSupplyKind;
  try {
    supplyKind = await inferTraitementSupplyKind(supabase, organizationId, lines);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lignes invalides" },
      { status: 400 },
    );
  }

  const project = await resolveProjectFields(supabase, organizationId, body.projectId);
  const depot =
    supplyKind === "gasoil"
      ? { depot_id: null }
      : await resolveDepotFields(supabase, organizationId, body.depotId);
  const number = await nextTraitementNumber(organizationId, body.traitementType);
  const id = opsId("trt");
  const steps = defaultTraitementSteps(body.traitementType);

  const { error } = await supabase.from("admin_traitements").insert({
    id,
    user_id: userId,
    organization_id: organizationId,
    traitement_type: body.traitementType,
    supply_kind: supplyKind,
    number,
    label: body.label.trim(),
    project_id: project.project_id,
    depot_id: depot.depot_id,
    supplier_id: body.traitementType === "achat" ? body.supplierId?.trim() || null : null,
    customer_id: body.traitementType === "vente" ? body.customerId?.trim() || null : null,
    partner_name: body.partnerName?.trim() || "",
    status: "open",
    notes: body.notes?.trim() || "",
    steps,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const linkedLines = await resolveLinesWithStock(
      supabase,
      organizationId,
      userId,
      body.traitementType,
      lines,
      supplyKind,
    );
    await insertLines(supabase, id, linkedLines);
  } catch (e) {
    await supabase.from("admin_traitements").delete().eq("id", id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lignes invalides" },
      { status: 400 },
    );
  }

  const created = await loadTraitementWithLines(supabase, id, organizationId);
  return NextResponse.json(created);
}

export async function PATCH(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as {
    id?: string;
    label?: string;
    projectId?: string;
    depotId?: string;
    supplierId?: string;
    customerId?: string;
    partnerName?: string;
    status?: TraitementStatus;
    notes?: string;
    steps?: TraitementSteps;
    lines?: TraitementLineInput[];
    registerStep?: "br" | "gasoil_bc" | "gasoil_bl";
    brDocNumber?: string;
    brDocDate?: string;
    brNotes?: string;
    bcDocNumber?: string;
    bcDocDate?: string;
    bcSupplier?: string;
    bcSupplierId?: string;
    bcLitres?: number;
    bcUnitPricePerLitre?: number;
    bcPumpMeter?: number;
    bcNotes?: string;
    blDocNumber?: string;
    blDocDate?: string;
    blSupplier?: string;
    blLitres?: number;
    blUnitPricePerLitre?: number;
    blPumpMeter?: number;
    blNotes?: string;
  };

  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  const existing = await loadTraitementWithLines(supabase, body.id, organizationId);
  if (!existing) return NextResponse.json({ error: "Traitement introuvable" }, { status: 404 });

  if (body.registerStep === "br") {
    try {
      const result = await registerTraitementBrStep(supabase, organizationId, userId, body.id, {
        docNumber: body.brDocNumber,
        docDate: body.brDocDate,
        notes: body.brNotes,
      });
      const updated = await loadTraitementWithLines(supabase, body.id, organizationId);
      return NextResponse.json({ ...updated, brRegister: result });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Enregistrement BR impossible" },
        { status: 400 },
      );
    }
  }

  if (body.registerStep === "gasoil_bc") {
    try {
      const result = await registerTraitementGasoilBcStep(supabase, organizationId, userId, body.id, {
        docNumber: body.bcDocNumber,
        docDate: body.bcDocDate,
        supplier: body.bcSupplier,
        supplierId: body.bcSupplierId,
        litres: body.bcLitres,
        unitPricePerLitre: body.bcUnitPricePerLitre,
        pumpMeter: body.bcPumpMeter,
        notes: body.bcNotes,
      });
      const updated = await loadTraitementWithLines(supabase, body.id, organizationId);
      return NextResponse.json({ ...updated, gasoilBcRegister: result });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Bon de commande gasoil impossible" },
        { status: 400 },
      );
    }
  }

  if (body.registerStep === "gasoil_bl") {
    try {
      const result = await registerTraitementGasoilBlStep(supabase, organizationId, userId, body.id, {
        docNumber: body.blDocNumber,
        docDate: body.blDocDate,
        supplier: body.blSupplier,
        litres: body.blLitres,
        unitPricePerLitre: body.blUnitPricePerLitre,
        pumpMeter: body.blPumpMeter,
        notes: body.blNotes,
      });
      const updated = await loadTraitementWithLines(supabase, body.id, organizationId);
      return NextResponse.json({ ...updated, gasoilBlRegister: result });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Réception gasoil impossible" },
        { status: 400 },
      );
    }
  }

  const project = body.projectId !== undefined
    ? await resolveProjectFields(supabase, organizationId, body.projectId)
    : null;
  const depot = body.depotId !== undefined
    ? await resolveDepotFields(supabase, organizationId, body.depotId)
    : null;

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.label !== undefined) payload.label = body.label.trim();
  if (project) payload.project_id = project.project_id;
  if (depot) payload.depot_id = depot.depot_id;
  if (body.partnerName !== undefined) payload.partner_name = body.partnerName.trim();
  if (body.notes !== undefined) payload.notes = body.notes.trim();
  if (body.status !== undefined) payload.status = body.status;
  if (body.steps !== undefined) {
    payload.steps = normalizeTraitementSteps(existing.traitementType, body.steps);
  }
  if (existing.traitementType === "achat" && body.supplierId !== undefined) {
    payload.supplier_id = body.supplierId.trim() || null;
  }
  if (existing.traitementType === "vente" && body.customerId !== undefined) {
    payload.customer_id = body.customerId.trim() || null;
  }

  let linesSupplyKind: TraitementSupplyKind | null = null;
  if (body.lines !== undefined) {
    const lines = parseLines(body.lines);
    if (lines.length === 0) {
      return NextResponse.json({ error: "Au moins un article requis" }, { status: 400 });
    }
    try {
      linesSupplyKind = await inferTraitementSupplyKind(supabase, organizationId, lines);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Lignes invalides" },
        { status: 400 },
      );
    }
    if (linesSupplyKind !== existing.supplyKind) {
      payload.supply_kind = linesSupplyKind;
      if (linesSupplyKind === "gasoil") payload.depot_id = null;
    }
  }

  const { error } = await supabase
    .from("admin_traitements")
    .update(payload)
    .eq("id", body.id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.lines !== undefined && linesSupplyKind) {
    const lines = parseLines(body.lines);
    await supabase.from("admin_traitement_lines").delete().eq("traitement_id", body.id);
    try {
      const linkedLines = await resolveLinesWithStock(
        supabase,
        organizationId,
        userId,
        existing.traitementType,
        lines,
        linesSupplyKind,
      );
      await insertLines(supabase, body.id, linkedLines);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Lignes invalides" },
        { status: 400 },
      );
    }
  }

  const updated = await loadTraitementWithLines(supabase, body.id, organizationId);
  if (updated && updated.steps.f?.status === "done") {
    try {
      await syncTraitementFinanceFromStoredQuote(supabase, organizationId, auth.userId, updated);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Synchronisation finance impossible" },
        { status: 500 },
      );
    }
  }
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_traitements")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
