import { NextResponse } from "next/server";
import type { MaterialCategory } from "@/components/admin/operations-types";
import { MATERIAL_CATEGORY_LABELS } from "@/components/admin/operations-types";
import { csvResponse } from "@/lib/admin/csv-response";
import {
  computeEstimatedHours,
  mapRentalContractRow,
  resolveEquipmentName,
  type RentalBonBody,
} from "@/lib/admin/map-rental-material";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { resolveBonLocationNo } from "@/lib/admin/rental-bon-number";
import { resolveProjectFields } from "@/lib/admin/project-resolve";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type MaterialRow = {
  id: string;
  material_category: string;
  reference: string;
  matricule: string;
  designation: string;
  sub_category: string;
  owner_name: string;
};

function buildPayload(
  body: RentalBonBody,
  project: { project_id: string | null; site_name: string },
  bonLocationNo: string,
  material: MaterialRow | null,
) {
  const dailyRate = Number(body.dailyRate) || 0;
  const daysCount = Number(body.daysCount) || 0;
  const transportMode = body.transportMode || "";
  const materialCategory = (
    material?.material_category ?? body.materialCategory ?? "engin"
  ) as MaterialCategory;
  const designation = material?.designation || body.designation?.trim() || "";
  const equipmentName =
    designation ||
    material?.reference ||
    material?.matricule ||
    resolveEquipmentName(body);

  return {
    material_id: material?.id ?? body.materialId ?? null,
    project_id: project.project_id,
    material_category: materialCategory,
    reference: material?.reference ?? body.reference?.trim() ?? "",
    matricule: material?.matricule ?? body.matricule?.trim() ?? "",
    designation,
    sub_category: material?.sub_category ?? body.subCategory?.trim() ?? "",
    owner_name: material?.owner_name ?? body.ownerName?.trim() ?? "",
    employee_id: body.employeeId?.trim() || null,
    driver_name: body.driverName?.trim() || "",
    daily_rate: dailyRate,
    days_count: daysCount,
    transport_mode: transportMode,
    transport_price: transportMode === "depart" ? Number(body.transportPrice) || 0 : 0,
    equipment_name: equipmentName,
    contract_no: bonLocationNo,
    hourly_rate: dailyRate > 0 ? dailyRate / 9 : Number(body.hourlyRate) || 0,
    hours_worked: daysCount > 0 ? computeEstimatedHours(daysCount) : Number(body.hoursWorked) || 0,
    status: body.status || "active",
    updated_at: new Date().toISOString(),
  };
}

async function loadMaterial(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  materialId: string,
) {
  const { data, error } = await supabase
    .from("admin_rental_materials")
    .select("id, material_category, reference, matricule, designation, sub_category, owner_name")
    .eq("id", materialId)
    .eq("organization_id", organizationId)
    .single();
  if (error || !data) return null;
  return data as MaterialRow;
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { data, error } = await getSupabaseAdminClient()
    .from("admin_rental_contracts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((r) => mapRentalContractRow(r as Record<string, unknown>));

  if (new URL(request.url).searchParams.get("format") === "csv") {
    return csvResponse(
      "bons-location.csv",
      [
        "N° bon location",
        "Catégorie",
        "Chantier",
        "Réf./Matricule",
        "Désignation",
        "Propriétaire",
        "Chauffeur",
        "Tarif/jr",
        "Jr",
        "Heures est.",
        "Transport",
        "Total MAD",
      ],
      rows.map((r) => [
        r.bonLocationNo,
        MATERIAL_CATEGORY_LABELS[r.materialCategory],
        r.projectId || "",
        r.reference || r.matricule,
        r.designation,
        r.ownerName,
        r.driverName,
        String(r.dailyRate),
        String(r.daysCount),
        String(r.estimatedHours),
        r.transportMode === "depart" ? `Départ ${r.transportPrice}` : r.transportMode || "—",
        String(r.totalMad),
      ]),
    );
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const body = (await request.json()) as RentalBonBody;

  const supabase = getSupabaseAdminClient();
  let materialId = body.materialId?.trim() || "";
  let material: MaterialRow | null = null;

  if (body.id && !materialId) {
    const { data: existing } = await supabase
      .from("admin_rental_contracts")
      .select("material_id")
      .eq("id", String(body.id))
      .eq("organization_id", organizationId)
      .single();
    materialId = (existing?.material_id as string) || "";
  }

  if (materialId) {
    material = await loadMaterial(supabase, organizationId, materialId);
    if (!material) {
      return NextResponse.json({ error: "Matériel introuvable" }, { status: 400 });
    }
  } else if (!body.id) {
    return NextResponse.json({ error: "Sélectionnez un matériel" }, { status: 400 });
  }

  const project = await resolveProjectFields(supabase, organizationId, body.projectId);

  let bonLocationNo = (body.bonLocationNo ?? body.contractNo)?.trim() || "";
  if (!bonLocationNo) {
    if (body.id) {
      const { data: existing } = await supabase
        .from("admin_rental_contracts")
        .select("contract_no")
        .eq("id", String(body.id))
        .eq("organization_id", organizationId)
        .single();
      bonLocationNo = (existing?.contract_no as string) || "";
    } else {
      bonLocationNo = await resolveBonLocationNo(organizationId);
    }
  }

  const payload = buildPayload(body, project, bonLocationNo, material);

  const result = body.id
    ? await supabase
        .from("admin_rental_contracts")
        .update(payload)
        .eq("id", String(body.id))
        .eq("organization_id", organizationId)
        .select("*")
        .single()
    : await supabase
        .from("admin_rental_contracts")
        .insert({ id: opsId("rent"), user_id: userId, organization_id: organizationId, ...payload })
        .select("*")
        .single();

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json(mapRentalContractRow(result.data as Record<string, unknown>));
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await getSupabaseAdminClient()
    .from("admin_rental_contracts")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
