import type { QuoteDraft } from "@/components/admin/devis-types";
import type { StockMovementType } from "@/components/admin/operations-types";
import { mapTraitementLine, mapTraitementRow } from "@/lib/admin/map-traitement";
import { normalizeTraitementSteps, type TraitementStepKey, type TraitementType } from "@/lib/admin/traitement-types";
import { opsId } from "@/lib/admin/ops-id";
import { applyGasoilStockForBon } from "@/lib/admin/gasoil-stock-server";
import { gasoilBonPriceFields } from "@/lib/admin/gasoil-bon";
import { resolveBonGasoilNo } from "@/lib/admin/bon-gasoil-number";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { stockMovementQtyDelta } from "@/lib/admin/stock-movement-qty";
import { resolveTraitementLineLinks } from "@/lib/admin/article-inventory";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

function movementTypeForStep(
  traitementType: TraitementType,
  step: TraitementStepKey,
): StockMovementType | null {
  if (step === "bl") return traitementType === "achat" ? "entry" : "exit";
  if (step === "br") return traitementType === "achat" ? "exit" : "return";
  return null;
}

function movementMarker(traitementType: TraitementType, traitementId: string, step: TraitementStepKey) {
  return `traitement:${traitementType}:${traitementId}:${step}`;
}

async function movementAlreadyApplied(
  supabase: Supabase,
  organizationId: string,
  traitementType: TraitementType,
  traitementId: string,
  step: TraitementStepKey,
) {
  const newMarker = movementMarker(traitementType, traitementId, step);
  const legacyMarker = `traitement:${traitementId}:${step}`;
  const { data } = await supabase
    .from("admin_stock_movements")
    .select("id")
    .eq("organization_id", organizationId)
    .or(`notes.ilike.%${newMarker}%,notes.ilike.%${legacyMarker}%`)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function loadTraitement(supabase: Supabase, organizationId: string, traitementId: string) {
  const { data: row, error } = await supabase
    .from("admin_traitements")
    .select("*")
    .eq("id", traitementId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: lineRows } = await supabase
    .from("admin_traitement_lines")
    .select("*")
    .eq("traitement_id", traitementId)
    .order("sort_order");

  return mapTraitementRow(
    row as Record<string, unknown>,
    (lineRows ?? []).map((l) => mapTraitementLine(l as Record<string, unknown>)),
  );
}

async function resolveStockItemId(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  traitementType: TraitementType,
  line: {
    productId?: string | null;
    stockItemId: string | null;
    reference: string;
    designation: string;
    unit: string;
    unitPrice: number;
  },
) {
  const links = await resolveTraitementLineLinks(supabase, organizationId, userId, line, traitementType);
  return links.inventory;
}

export async function applyTraitementStockMovements(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  params: {
    traitementId: string;
    traitementType: TraitementType;
    step: TraitementStepKey;
    docNumber: string;
    docDate: string;
    partnerName: string;
    projectId?: string | null;
    lines: {
      productId?: string | null;
      stockItemId: string | null;
      reference: string;
      designation: string;
      unit: string;
      qty: number;
      unitPrice: number;
    }[];
  },
) {
  const movementType = movementTypeForStep(params.traitementType, params.step);
  if (!movementType) return { applied: 0, skipped: 0 };

  if (await movementAlreadyApplied(supabase, organizationId, params.traitementType, params.traitementId, params.step)) {
    return { applied: 0, skipped: params.lines.length, alreadyDone: true };
  }

  const project = await resolveProjectFields(supabase, organizationId, params.projectId);
  const marker = movementMarker(params.traitementType, params.traitementId, params.step);
  let applied = 0;
  let skipped = 0;

  for (const line of params.lines) {
    const qty = Math.max(0, Number(line.qty) || 0);
    if (qty <= 0) {
      skipped += 1;
      continue;
    }

    const stockRow = await resolveStockItemId(
      supabase,
      organizationId,
      userId,
      params.traitementType,
      line,
    );
    if (!stockRow) {
      skipped += 1;
      continue;
    }

    const currentQty = Number(stockRow.qty ?? 0);
    const delta = stockMovementQtyDelta(movementType, qty);
    const newQty = Math.max(0, currentQty + delta);

    if (movementType === "exit" && currentQty < qty) {
      throw new Error(
        `Stock insuffisant pour ${stockRow.designation} (${currentQty} disponibles, ${qty} demandés).`,
      );
    }

    const { error: movErr } = await supabase.from("admin_stock_movements").insert({
      id: opsId("mov"),
      user_id: userId,
      organization_id: organizationId,
      item_id: stockRow.id,
      movement_type: movementType,
      movement_date: params.docDate || new Date().toISOString().slice(0, 10),
      reference: stockRow.reference,
      designation: stockRow.designation,
      category: stockRow.category,
      article_code: stockRow.articleCode ?? "",
      unit: line.unit || stockRow.unit || "PIECE",
      qty,
      unit_price: line.unitPrice || Number(stockRow.unitPrice ?? 0),
      stock_after: newQty,
      assignment: project.site_name || "",
      exit_voucher_no: "",
      requester: "",
      storekeeper: "",
      supplier: params.traitementType === "achat" ? params.partnerName : "",
      delivery_note: params.docNumber,
      project_id: project.project_id,
      site_name: project.site_name,
      depot_id: null,
      notes: `${marker} · ${params.docNumber}`,
    });

    if (movErr) throw new Error(movErr.message);

    const { error: updErr } = await supabase
      .from("admin_stock_items")
      .update({ qty: newQty, updated_at: new Date().toISOString() })
      .eq("id", stockRow.id)
      .eq("organization_id", organizationId);

    if (updErr) throw new Error(updErr.message);
    applied += 1;
  }

  return { applied, skipped, alreadyDone: false };
}

export async function syncTraitementAfterQuoteSave(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  quote: QuoteDraft,
  options?: { isCreate?: boolean },
) {
  if (!quote.traitementId || !quote.traitementStep || !quote.traitementType) {
    return null;
  }

  const traitement = await loadTraitement(supabase, organizationId, quote.traitementId);
  if (!traitement) return null;

  const step = quote.traitementStep;
  if (traitement.supplyKind === "gasoil" && (step === "bl" || step === "bc")) {
    throw new Error(
      step === "bc"
        ? "Pour un traitement gasoil, enregistrez le BC via Bon de commande gasoil (pas document commercial)."
        : "Pour un traitement gasoil, enregistrez le BL via Réception gasoil (pas bon de livraison articles).",
    );
  }
  const steps = normalizeTraitementSteps(traitement.traitementType, traitement.steps);
  const prev = steps[step];
  const docNumber = quote.quoteNumber?.trim() || prev?.docNumber || "";
  const docDate = quote.date?.trim() || new Date().toISOString().slice(0, 10);

  steps[step] = {
    status: "done",
    docNumber,
    docDate,
    quoteId: quote.id,
  };

  let status = traitement.status;
  if (step === "f" && status !== "cancelled") {
    status = "completed";
  } else if (status === "open") {
    status = "in_progress";
  }

  const { error } = await supabase
    .from("admin_traitements")
    .update({
      steps,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quote.traitementId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  let stockResult = null;
  const shouldApplyStock =
    options?.isCreate !== false && (!prev?.quoteId || prev.quoteId !== quote.id);

  if (shouldApplyStock) {
    stockResult = await applyTraitementStockMovements(supabase, organizationId, userId, {
      traitementId: traitement.id,
      traitementType: traitement.traitementType,
      step,
      docNumber,
      docDate,
      partnerName: traitement.partnerName,
      projectId: traitement.projectId,
      lines: traitement.lines,
    });
  }

  return { traitementId: traitement.id, step, stockResult };
}

export async function registerTraitementBrStep(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  traitementId: string,
  params: { docNumber?: string; docDate?: string; notes?: string },
) {
  const traitement = await loadTraitement(supabase, organizationId, traitementId);
  if (!traitement) throw new Error("Traitement introuvable");

  const docNumber = params.docNumber?.trim() || `BR-${traitement.number}`;
  const docDate = params.docDate?.trim() || new Date().toISOString().slice(0, 10);

  const steps = normalizeTraitementSteps(traitement.traitementType, traitement.steps);
  steps.br = { status: "done", docNumber, docDate };

  const stockResult = await applyTraitementStockMovements(supabase, organizationId, userId, {
    traitementId: traitement.id,
    traitementType: traitement.traitementType,
    step: "br",
    docNumber,
    docDate,
    partnerName: traitement.partnerName,
    projectId: traitement.projectId,
    lines: traitement.lines,
  });

  let status = traitement.status;
  if (status === "open") status = "in_progress";

  const notes = params.notes?.trim()
    ? `${traitement.notes}\nBR: ${params.notes}`.trim()
    : traitement.notes;

  const { error } = await supabase
    .from("admin_traitements")
    .update({
      steps,
      status,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", traitementId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  return { traitementId, stockResult };
}

export async function registerTraitementGasoilBcStep(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  traitementId: string,
  params: {
    docNumber?: string;
    docDate?: string;
    supplier?: string;
    supplierId?: string;
    litres?: number;
    unitPricePerLitre?: number;
    pumpMeter?: number;
    notes?: string;
  },
) {
  const traitement = await loadTraitement(supabase, organizationId, traitementId);
  if (!traitement) throw new Error("Traitement introuvable");
  if (traitement.supplyKind !== "gasoil") {
    throw new Error("Cette action est réservée aux traitements gasoil.");
  }
  if (!traitement.projectId) {
    throw new Error("Chantier requis sur le traitement gasoil.");
  }

  const line = traitement.lines[0];
  const litres = Math.max(0, Number(params.litres ?? line?.qty) || 0);
  if (litres <= 0) throw new Error("Quantité en litres requise.");

  const docNumber = await resolveBonGasoilNo(organizationId, params.docNumber, "achat");
  const docDate = params.docDate?.trim() || new Date().toISOString().slice(0, 10);
  const supplier = params.supplier?.trim() || traitement.partnerName.trim();
  const project = await resolveProjectFields(supabase, organizationId, traitement.projectId);
  const bonId = opsId("bon");
  const pumpMeter =
    params.pumpMeter != null && !Number.isNaN(Number(params.pumpMeter)) ? Number(params.pumpMeter) : null;
  const unitPrice =
    params.unitPricePerLitre != null && params.unitPricePerLitre > 0
      ? params.unitPricePerLitre
      : line?.unitPrice > 0
        ? line.unitPrice
        : null;

  const notes = [
    params.notes?.trim(),
    traitement.purchaseRequestId ? `DA liée` : "",
    `traitement:achat:${traitementId}:bc`,
  ]
    .filter(Boolean)
    .join(" · ");

  const { error: bonErr } = await supabase.from("admin_gasoil_bons").insert({
    id: bonId,
    user_id: userId,
    organization_id: organizationId,
    number: docNumber,
    bon_type: "achat",
    vehicle_category: "engin",
    project_id: project.project_id,
    site_name: project.site_name,
    bon_date: docDate,
    litres,
    pump_meter: pumpMeter,
    supplier,
    notes,
    traitement_id: traitementId,
    purchase_request_id: traitement.purchaseRequestId,
    ...(unitPrice != null ? gasoilBonPriceFields(litres, unitPrice) : { unit_price: 0, total_amount: 0 }),
  });

  if (bonErr) throw new Error(bonErr.message);

  if (line?.id && unitPrice != null) {
    await supabase
      .from("admin_traitement_lines")
      .update({ unit_price: unitPrice })
      .eq("id", line.id)
      .eq("traitement_id", traitementId);
  }

  const steps = normalizeTraitementSteps(traitement.traitementType, traitement.steps);
  steps.bc = {
    status: "done",
    docNumber,
    docDate,
    gasoilBonId: bonId,
  };

  let status = traitement.status;
  if (status === "open") status = "in_progress";

  const partnerName = supplier || traitement.partnerName;
  const supplierId = params.supplierId?.trim() || traitement.supplierId;

  const { error } = await supabase
    .from("admin_traitements")
    .update({
      steps,
      status,
      partner_name: partnerName,
      supplier_id: supplierId || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", traitementId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  return { traitementId, bonId, docNumber, litres };
}

export async function registerTraitementGasoilBlStep(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  traitementId: string,
  params: {
    docNumber?: string;
    docDate?: string;
    supplier?: string;
    litres?: number;
    unitPricePerLitre?: number;
    pumpMeter?: number;
    notes?: string;
  },
) {
  const traitement = await loadTraitement(supabase, organizationId, traitementId);
  if (!traitement) throw new Error("Traitement introuvable");
  if (traitement.supplyKind !== "gasoil") {
    throw new Error("Cette action est réservée aux traitements gasoil.");
  }
  if (!traitement.projectId) {
    throw new Error("Chantier requis sur le traitement gasoil.");
  }

  const line = traitement.lines[0];
  const litres = Math.max(0, Number(params.litres ?? line?.qty) || 0);
  if (litres <= 0) throw new Error("Quantité en litres requise.");

  const bcBonId = traitement.steps.bc?.gasoilBonId?.trim();
  const docDate = params.docDate?.trim() || new Date().toISOString().slice(0, 10);
  const supplier = params.supplier?.trim() || traitement.partnerName.trim();
  const project = await resolveProjectFields(supabase, organizationId, traitement.projectId);
  const pumpMeter =
    params.pumpMeter != null && !Number.isNaN(Number(params.pumpMeter)) ? Number(params.pumpMeter) : null;

  let docNumber = params.docNumber?.trim() || "";
  let bonId: string;

  if (bcBonId) {
    const { data: bcBon, error: bcErr } = await supabase
      .from("admin_gasoil_bons")
      .select("id, number, supplier, litres, notes")
      .eq("id", bcBonId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (bcErr) throw new Error(bcErr.message);
    if (!bcBon) throw new Error("Bon de commande gasoil introuvable — enregistrez d'abord le BC.");

    bonId = bcBon.id as string;
    if (!docNumber) docNumber = (bcBon.number as string) || traitement.steps.bc?.docNumber || "";

    await applyGasoilStockForBon(supabase, organizationId, userId, {
      bonType: "achat",
      litres,
      projectId: traitement.projectId,
      supplier: supplier || (bcBon.supplier as string) || "",
      bonNumber: docNumber,
      bonDate: docDate,
      unitPricePerLitre:
        params.unitPricePerLitre != null && params.unitPricePerLitre > 0
          ? params.unitPricePerLitre
          : line?.unitPrice > 0
            ? line.unitPrice
            : undefined,
    });

    const blUnitPrice =
      params.unitPricePerLitre != null && params.unitPricePerLitre > 0
        ? params.unitPricePerLitre
        : line?.unitPrice > 0
          ? line.unitPrice
          : 0;

    const receptionNote = [
      params.notes?.trim(),
      docNumber !== bcBon.number ? `BL: ${docNumber}` : "",
      `traitement:achat:${traitementId}:bl`,
    ]
      .filter(Boolean)
      .join(" · ");

    const mergedNotes = [(bcBon.notes as string) || "", receptionNote].filter(Boolean).join(" · ");
    await supabase
      .from("admin_gasoil_bons")
      .update({
        litres,
        pump_meter: pumpMeter,
        supplier: supplier || (bcBon.supplier as string) || "",
        notes: mergedNotes,
        ...(blUnitPrice > 0 ? gasoilBonPriceFields(litres, blUnitPrice) : {}),
      })
      .eq("id", bonId)
      .eq("organization_id", organizationId);
  } else {
    docNumber = await resolveBonGasoilNo(organizationId, docNumber || undefined, "achat");
    bonId = opsId("bon");

    const blUnitPriceParam =
      params.unitPricePerLitre != null && params.unitPricePerLitre > 0
        ? params.unitPricePerLitre
        : line?.unitPrice > 0
          ? line.unitPrice
          : undefined;

    const stockResult = await applyGasoilStockForBon(supabase, organizationId, userId, {
      bonType: "achat",
      litres,
      projectId: traitement.projectId,
      supplier,
      bonNumber: docNumber,
      bonDate: docDate,
      unitPricePerLitre: blUnitPriceParam,
    });

    const blUnitPrice = blUnitPriceParam ?? stockResult?.unitPricePerLitre ?? 0;

    const notes = [
      params.notes?.trim(),
      traitement.purchaseRequestId ? `DA liée` : "",
      `traitement:achat:${traitementId}:bl`,
    ]
      .filter(Boolean)
      .join(" · ");

    const { error: bonErr } = await supabase.from("admin_gasoil_bons").insert({
      id: bonId,
      user_id: userId,
      organization_id: organizationId,
      number: docNumber,
      bon_type: "achat",
      vehicle_category: "engin",
      project_id: project.project_id,
      site_name: project.site_name,
      bon_date: docDate,
      litres,
      pump_meter: pumpMeter,
      supplier,
      notes,
      traitement_id: traitementId,
      purchase_request_id: traitement.purchaseRequestId,
      ...(blUnitPrice > 0 ? gasoilBonPriceFields(litres, blUnitPrice) : { unit_price: 0, total_amount: 0 }),
    });

    if (bonErr) throw new Error(bonErr.message);
  }

  const steps = normalizeTraitementSteps(traitement.traitementType, traitement.steps);
  steps.bl = {
    status: "done",
    docNumber,
    docDate,
    gasoilBonId: bonId,
  };

  let status = traitement.status;
  if (status === "open") status = "in_progress";

  const { error } = await supabase
    .from("admin_traitements")
    .update({
      steps,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", traitementId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);

  return { traitementId, bonId, docNumber, litres };
}
