import { mapTraitementLine, mapTraitementRow } from "@/lib/admin/map-traitement";
import { opsId } from "@/lib/admin/ops-id";
import { nextTraitementNumber } from "@/lib/admin/traitement-number";
import { defaultTraitementSteps } from "@/lib/admin/traitement-types";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

async function loadAchatTraitement(supabase: Supabase, organizationId: string, achatId: string) {
  const { data: row, error } = await supabase
    .from("admin_traitements")
    .select("*")
    .eq("id", achatId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Traitement achat introuvable.");
  if (row.traitement_type !== "achat") {
    throw new Error("Seuls les traitements achat peuvent être convertis en vente.");
  }
  if (row.vente_traitement_id) {
    throw new Error("Un traitement vente est déjà lié à cet achat.");
  }
  if ((row.supply_kind as string) === "gasoil") {
    throw new Error("La conversion achat → vente concerne les articles, pas le gasoil.");
  }

  const steps = row.steps as Record<string, { status?: string }> | null;
  if (steps?.bl?.status !== "done") {
    throw new Error("Enregistrez d'abord le BL achat (réception / entrée stock) avant de passer en vente.");
  }

  const { data: lineRows, error: lineErr } = await supabase
    .from("admin_traitement_lines")
    .select("*")
    .eq("traitement_id", achatId)
    .order("sort_order");
  if (lineErr) throw new Error(lineErr.message);
  if (!lineRows?.length) throw new Error("Aucune ligne article sur ce traitement.");

  return mapTraitementRow(
    row as Record<string, unknown>,
    lineRows.map((l) => mapTraitementLine(l as Record<string, unknown>)),
  );
}

export async function createVenteTraitementFromAchat(
  supabase: Supabase,
  organizationId: string,
  userId: string,
  achatId: string,
  params: {
    customerId?: string;
    customerName?: string;
    label?: string;
    lines?: { id: string; qty?: number; unitPrice?: number }[];
  },
) {
  const achat = await loadAchatTraitement(supabase, organizationId, achatId);
  const customerName = params.customerName?.trim() || achat.partnerName.trim();
  if (!customerName && !params.customerId?.trim()) {
    throw new Error("Client requis pour le traitement vente.");
  }

  const lineOverrides = new Map((params.lines ?? []).map((l) => [l.id, l]));

  const venteId = opsId("trt");
  const number = await nextTraitementNumber(organizationId, "vente");
  const steps = defaultTraitementSteps("vente");
  const label = params.label?.trim() || `Vente — ${achat.label.trim() || achat.number}`;

  const { error: trtErr } = await supabase.from("admin_traitements").insert({
    id: venteId,
    user_id: userId,
    organization_id: organizationId,
    traitement_type: "vente",
    supply_kind: "articles",
    number,
    label,
    project_id: achat.projectId,
    supplier_id: null,
    customer_id: params.customerId?.trim() || null,
    partner_name: customerName,
    status: "open",
    notes: [`Suite achat ${achat.number}`, achat.notes.trim()].filter(Boolean).join("\n"),
    steps,
    source_traitement_id: achatId,
    purchase_request_id: achat.purchaseRequestId,
  });

  if (trtErr) throw new Error(trtErr.message);

  const lineInserts = achat.lines.map((line, i) => {
    const override = lineOverrides.get(line.id);
    const qty = Math.max(0, Number(override?.qty ?? line.qty) || 0);
    const unitPrice = Math.max(0, Number(override?.unitPrice ?? line.unitPrice) || 0);
    if (qty <= 0) throw new Error(`Quantité invalide pour « ${line.designation || line.reference} ».`);
    return {
      id: opsId("trl"),
      traitement_id: venteId,
      product_id: line.productId,
      stock_item_id: line.stockItemId,
      reference: line.reference,
      designation: line.designation,
      unit: line.unit,
      qty,
      unit_price: unitPrice,
      sort_order: i,
    };
  });

  const { error: lineErr } = await supabase.from("admin_traitement_lines").insert(lineInserts);
  if (lineErr) {
    await supabase.from("admin_traitements").delete().eq("id", venteId);
    throw new Error(lineErr.message);
  }

  const { error: linkErr } = await supabase
    .from("admin_traitements")
    .update({
      vente_traitement_id: venteId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", achatId)
    .eq("organization_id", organizationId);

  if (linkErr) {
    await supabase.from("admin_traitements").delete().eq("id", venteId);
    throw new Error(linkErr.message);
  }

  return { traitementId: venteId, traitementNumber: number, achatId };
}
