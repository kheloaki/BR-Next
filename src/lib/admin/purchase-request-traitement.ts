import type { PurchaseRequest } from "@/components/admin/operations-types";
import { resolveTraitementLineLinks } from "@/lib/admin/article-inventory";
import { getGasoilStockItem } from "@/lib/admin/gasoil-stock-server";
import { isGasoilPurchaseRequest } from "@/lib/admin/map-purchase-request";
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

  let productId: string | null = da.productId ?? null;
  let stockItemId: string | null = da.stockItemId ?? null;
  let reference = da.reference || "";
  let designation = da.designation.trim() || da.subject.trim();
  let unit = da.unit || "PIECE";
  const qty = da.qty;
  const unitPrice = da.unitPrice;

  if (isGasoil) {
    const gasoilStock = da.stockItemId
      ? await supabase
          .from("admin_stock_items")
          .select("id")
          .eq("id", da.stockItemId)
          .eq("organization_id", organizationId)
          .maybeSingle()
          .then((r) => r.data?.id as string | undefined)
      : null;
    const stockId = gasoilStock ?? (await getGasoilStockItem(supabase, organizationId))?.id;
    if (!stockId) throw new Error("Stock gasoil introuvable — configurez le carburant d'abord.");
    stockItemId = stockId;
    productId = null;
    reference = reference || "GASOIL";
    designation = designation || "Gasoil";
    unit = "L";
  } else {
    const linked = await resolveTraitementLineLinks(
      supabase,
      organizationId,
      userId,
      {
        productId: da.productId ?? undefined,
        stockItemId: da.stockItemId ?? undefined,
        reference,
        designation,
        unit,
        unitPrice,
      },
      "achat",
    );
    productId = linked.productId ?? da.productId ?? null;
    stockItemId = linked.stockItemId ?? da.stockItemId ?? null;
  }

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

  const { error: lineErr } = await supabase.from("admin_traitement_lines").insert({
    id: opsId("trl"),
    traitement_id: traitementId,
    product_id: productId,
    stock_item_id: stockItemId,
    reference,
    designation,
    unit,
    qty,
    unit_price: unitPrice,
    sort_order: 0,
  });

  if (lineErr) {
    await supabase.from("admin_traitements").delete().eq("id", traitementId);
    throw new Error(lineErr.message);
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
