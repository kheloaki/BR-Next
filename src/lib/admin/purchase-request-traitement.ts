import type { PurchaseRequest } from "@/components/admin/operations-types";
import { resolveTraitementLineLinks } from "@/lib/admin/article-inventory";
import { isGasoilPurchaseRequest } from "@/lib/admin/map-purchase-request";
import { GASOIL_UNIT } from "@/lib/admin/gasoil-stock";
import { parsePurchaseRequestLines } from "@/lib/admin/map-purchase-request-lines";
import { opsId } from "@/lib/admin/ops-id";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { nextTraitementNumber } from "@/lib/admin/traitement-number";
import { defaultTraitementSteps } from "@/lib/admin/traitement-types";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

export async function createTraitementFromPurchaseRequest(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  da: PurchaseRequest,
) {
  if (da.status !== "approved") {
    throw new Error("Seules les DA approuvées peuvent être converties en traitement.");
  }
  if (da.traitementId) {
    throw new Error("Cette DA est déjà liée à un traitement achat.");
  }

  const isGasoil = isGasoilPurchaseRequest(da);
  const project = await resolveProjectFields(supabase, organizationId, da.projectId);
  const number = await nextTraitementNumber(organizationId, "achat");
  const traitementId = opsId("trt");
  const steps = defaultTraitementSteps("achat");

  const daLines = da.lines?.length ? da.lines : parsePurchaseRequestLines(da as unknown as Record<string, unknown>);

  const { error: trtErr } = await supabase.from("admin_traitements").insert({
    id: traitementId,
    user_id: userId,
    organization_id: organizationId,
    traitement_type: "achat",
    supply_kind: isGasoil ? "gasoil" : "articles",
    number,
    label: da.subject.trim(),
    project_id: project.project_id,
    supplier_id: null,
    customer_id: null,
    partner_name: da.supplier.trim(),
    status: "open",
    notes: [`Origine DA ${da.number}`, da.justification.trim()].filter(Boolean).join("\n"),
    steps,
    purchase_request_id: da.id,
  });

  if (trtErr) throw new Error(trtErr.message);

  const sourceLines = isGasoil
    ? [
        {
          reference: da.reference || "GASOIL",
          designation: da.designation.trim() || da.subject.trim() || "Gasoil",
          unit: GASOIL_UNIT,
          qty: da.qty,
          unitPrice: da.unitPrice,
          productId: da.productId,
          stockItemId: da.stockItemId,
        },
      ]
    : daLines;

  if (sourceLines.length === 0) {
    await supabase.from("admin_traitements").delete().eq("id", traitementId);
    throw new Error("Aucune ligne article sur cette DA.");
  }

  for (let i = 0; i < sourceLines.length; i++) {
    const line = sourceLines[i]!;
    let reference = line.reference || "";
    let designation = line.designation.trim() || da.subject.trim();
    let unit = line.unit || (isGasoil ? GASOIL_UNIT : "PIECE");
    const qty = line.qty;
    const unitPrice = line.unitPrice;

    const linked = await resolveTraitementLineLinks(
      supabase,
      organizationId,
      userId,
      {
        productId: line.productId ?? undefined,
        stockItemId: line.stockItemId ?? undefined,
        reference,
        designation,
        unit,
        unitPrice,
      },
      "achat",
      isGasoil ? { supplyKind: "gasoil" } : undefined,
    );

    const { error: lineErr } = await supabase.from("admin_traitement_lines").insert({
      id: opsId("trl"),
      traitement_id: traitementId,
      product_id: linked.productId ?? line.productId ?? null,
      stock_item_id: linked.stockItemId ?? line.stockItemId ?? null,
      reference,
      designation,
      unit,
      qty,
      unit_price: unitPrice,
      sort_order: i,
    });

    if (lineErr) {
      await supabase.from("admin_traitements").delete().eq("id", traitementId);
      throw new Error(lineErr.message);
    }
  }

  const { error: daErr } = await supabase
    .from("admin_purchase_requests")
    .update({
      traitement_id: traitementId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", da.id)
    .eq("organization_id", organizationId);

  if (daErr) throw new Error(daErr.message);

  return { traitementId, traitementNumber: number, supplyKind: isGasoil ? "gasoil" as const : "articles" as const };
}
