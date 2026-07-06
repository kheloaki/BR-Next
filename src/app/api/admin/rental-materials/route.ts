import { NextResponse } from "next/server";
import type { MaterialCategory, RentalLocationMode } from "@/components/admin/operations-types";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { rentalMaterialsCsv } from "@/lib/admin/referential-csv-export";
import { mapRentalMaterialRow, type RentalMaterialBody } from "@/lib/admin/map-rental-material-catalog";
import { isMatriculeComplete } from "@/lib/admin/moroccan-matricule";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { DEFAULT_VAT_RATE } from "@/lib/admin/price-ht-ttc";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function validatePricing(body: RentalMaterialBody, cat: MaterialCategory) {
  if (cat === "other") return null;
  const mode = (body.rentalMode || "jour") as RentalLocationMode;

  if (mode === "jour") {
    if ((body.dailyRate ?? 0) <= 0) return "Tarif journalier requis";
    return null;
  }

  if (!body.contractStartDate?.trim()) {
    return "Date de début du contrat requise";
  }
  const openEnded = Boolean(body.contractOpenEnded);
  const end = body.contractEndDate?.trim() ?? "";
  if (!openEnded && end && end < body.contractStartDate.trim()) {
    return "La date de fin doit être postérieure à la date de début";
  }

  if (mode === "mois" && (body.monthlyPriceHt ?? 0) <= 0) {
    return "Prix mensuel HT ou TTC requis";
  }
  if (mode === "forfait" && (body.forfaitPriceHt ?? 0) <= 0) {
    return "Montant forfait HT ou TTC requis";
  }
  return null;
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_rental_materials")
    .select("*")
    .eq("organization_id", organizationId)
    .order("designation");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((r) => mapRentalMaterialRow(r as Record<string, unknown>));
  const exportFormat = new URL(request.url).searchParams.get("format");
  if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
    return rentalMaterialsCsv(rows, parseExportFormat(exportFormat));
  }
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as RentalMaterialBody;

  const cat = (body.materialCategory || "engin") as MaterialCategory;
  const designation = body.designation?.trim() || "";
  if (!designation && cat !== "engin" && cat !== "groupe_electrogen") {
    return NextResponse.json({ error: "Désignation requise" }, { status: 400 });
  }
  if ((cat === "engin" || cat === "groupe_electrogen") && !designation && !body.reference?.trim()) {
    return NextResponse.json({ error: "Référence ou désignation requise" }, { status: 400 });
  }
  if ((cat === "camion" || cat === "voiture") && !isMatriculeComplete(body.matricule ?? "")) {
    return NextResponse.json({ error: "Matricule complet requis (numéro · lettre · wilaya)" }, { status: 400 });
  }
  if (cat === "voiture" && !body.driverContactId && !body.driverName?.trim() && !body.employeeId) {
    return NextResponse.json({ error: "Sélectionnez un conducteur." }, { status: 400 });
  }

  const pricingErr = validatePricing(body, cat);
  if (pricingErr) {
    return NextResponse.json({ error: pricingErr }, { status: 400 });
  }

  const mode = (body.rentalMode || "jour") as RentalLocationMode;
  const transportMode =
    mode === "jour" && (cat === "engin" || cat === "groupe_electrogen") ? body.transportMode || "" : "";
  const transportPrice = transportMode === "depart" ? Number(body.transportPrice) || 0 : 0;
  const openEnded = Boolean(body.contractOpenEnded);

  const payload = {
    material_category: cat,
    project_id: body.projectId?.trim() || null,
    reference: body.reference?.trim() || "",
    matricule: body.matricule?.trim() || "",
    designation: designation || body.reference?.trim() || body.matricule?.trim() || "",
    sub_category: body.subCategory?.trim() || "",
    owner_name: body.ownerName?.trim() || "",
    supplier_id: body.supplierId?.trim() || null,
    employee_id: null,
    driver_name: body.driverName?.trim() || "",
    driver_contact_id: body.driverContactId?.trim() || null,
    rental_mode: mode,
    contract_start_date:
      mode === "jour" ? null : body.contractStartDate?.trim() || null,
    contract_end_date:
      mode === "jour" || openEnded ? null : body.contractEndDate?.trim() || null,
    contract_open_ended: mode !== "jour" && openEnded,
    daily_rate: mode === "jour" ? Number(body.dailyRate) || 0 : 0,
    days_count: 0,
    monthly_price_ht: mode === "mois" ? Number(body.monthlyPriceHt) || 0 : 0,
    forfait_price_ht: mode === "forfait" ? Number(body.forfaitPriceHt) || 0 : 0,
    vat_rate: DEFAULT_VAT_RATE,
    transport_mode: transportMode,
    transport_price: transportPrice,
    active: body.active !== false,
    updated_at: new Date().toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  const result = body.id?.trim()
    ? await supabase
        .from("admin_rental_materials")
        .update(payload)
        .eq("id", body.id.trim())
        .eq("organization_id", organizationId)
        .select("*")
        .single()
    : await supabase
        .from("admin_rental_materials")
        .insert({
          id: opsId("rmat"),
          user_id: userId,
          organization_id: organizationId,
          ...payload,
        })
        .select("*")
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(mapRentalMaterialRow(result.data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_rental_materials")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
