import { NextResponse } from "next/server";
import type { MaterialCategory } from "@/components/admin/operations-types";
import { MATERIAL_CATEGORY_LABELS } from "@/components/admin/operations-types";
import { csvResponse } from "@/lib/admin/csv-response";
import {
  computeEstimatedHours,
  mapRentalContractRow,
  RENTAL_LOCATAIRE_DEFAULT,
  resolveEquipmentName,
  usageToDayFraction,
  type RentalBonBody,
  type RentalBonLineBody,
} from "@/lib/admin/map-rental-material";
import { RENTAL_HOURS_PER_DAY } from "@/components/admin/operations-types";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { opsId } from "@/lib/admin/ops-id";
import { formatBonLocationNo } from "@/lib/admin/rental-bon-number-format";
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

function normalizeLines(body: RentalBonBody, materials: Map<string, MaterialRow>) {
  const raw = body.lines ?? [];
  return raw
    .map((line: RentalBonLineBody) => {
      const material = line.materialId ? materials.get(line.materialId) : undefined;
      const usageUnit = line.usageUnit === "heure" ? ("heure" as const) : ("jour" as const);
      return {
        lineDate: line.lineDate?.slice(0, 10) || "",
        materialId: line.materialId || "",
        matricule: line.matricule?.trim() || material?.matricule || material?.reference || "",
        designation:
          line.designation?.trim() ||
          material?.designation ||
          [material?.designation, material?.sub_category].filter(Boolean).join(" — ") ||
          "",
        dailyRate: Number(line.dailyRate) || 0,
        usageQty: Number(line.usageQty) || 1,
        usageUnit,
      };
    })
    .filter((l) => l.lineDate && (l.designation || l.matricule) && l.dailyRate > 0 && l.usageQty > 0);
}

function buildPayload(
  body: RentalBonBody,
  project: { project_id: string | null; site_name: string },
  bonLocationNo: string,
  primaryMaterial: MaterialRow | null,
  lines: ReturnType<typeof normalizeLines>,
) {
  const firstLine = lines[0];

  const materialCategory = (
    primaryMaterial?.material_category ?? body.materialCategory ?? "engin"
  ) as MaterialCategory;
  const designation =
    primaryMaterial?.designation || firstLine?.designation || body.designation?.trim() || "";
  const dailyRate = lines.length > 0 ? lines[0]!.dailyRate : Number(body.dailyRate) || 0;
  const daysCount =
    lines.length > 0
      ? lines.reduce((s, l) => s + usageToDayFraction(l.usageQty, l.usageUnit), 0)
      : Number(body.daysCount) || 0;
  const gasoilTotal = 0;

  return {
    material_id: primaryMaterial?.id ?? firstLine?.materialId ?? body.materialId ?? null,
    project_id: project.project_id,
    locataire: body.locataire?.trim() || RENTAL_LOCATAIRE_DEFAULT,
    material_category: materialCategory,
    reference: primaryMaterial?.reference ?? body.reference?.trim() ?? firstLine?.matricule ?? "",
    matricule: primaryMaterial?.matricule ?? body.matricule?.trim() ?? firstLine?.matricule ?? "",
    designation,
    sub_category: primaryMaterial?.sub_category ?? body.subCategory?.trim() ?? "",
    owner_name: body.ownerName?.trim() || primaryMaterial?.owner_name || "",
    employee_id: null,
    driver_name: body.driverName?.trim() || "",
    driver_contact_id: body.driverContactId?.trim() || null,
    daily_rate: dailyRate,
    days_count: daysCount,
    line_date: firstLine?.lineDate || null,
    gasoil: gasoilTotal,
    bon_lines: lines,
    transport_mode: "",
    transport_price: 0,
    equipment_name: designation || resolveEquipmentName(body),
    contract_no: bonLocationNo,
    hourly_rate: dailyRate > 0 ? dailyRate / RENTAL_HOURS_PER_DAY : Number(body.hourlyRate) || 0,
    hours_worked: daysCount > 0 ? computeEstimatedHours(daysCount) : Number(body.hoursWorked) || 0,
    status: body.status || "active",
    updated_at: new Date().toISOString(),
  };
}

async function loadMaterials(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  ids: string[],
) {
  const map = new Map<string, MaterialRow>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from("admin_rental_materials")
    .select("id, material_category, reference, matricule, designation, sub_category, owner_name")
    .eq("organization_id", organizationId)
    .in("id", ids);
  for (const row of data ?? []) map.set(row.id as string, row as MaterialRow);
  return map;
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
        "Locataire",
        "Loueur",
        "Lieu travaux",
        "Conducteur",
        "Lignes",
        "Total MAD",
      ],
      rows.map((r) => [
        r.bonLocationNo,
        r.locataire,
        r.ownerName,
        r.projectId || "",
        r.driverName,
        String(r.bonLines.length || r.daysCount),
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

  if (!body.projectId?.trim()) {
    return NextResponse.json({ error: "Lieu de travaux (chantier) requis" }, { status: 400 });
  }
  if (!body.driverName?.trim() && !body.driverContactId?.trim()) {
    return NextResponse.json({ error: "Conducteur requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const materialIds = [
    ...new Set(
      (body.lines ?? [])
        .map((l) => l.materialId?.trim())
        .filter(Boolean) as string[],
    ),
  ];
  const materialsMap = await loadMaterials(supabase, organizationId, materialIds);
  const lines = normalizeLines(body, materialsMap);

  if (lines.length === 0) {
    return NextResponse.json({ error: "Au moins une ligne journalière valide requise" }, { status: 400 });
  }

  const primaryMaterial = lines[0]?.materialId
    ? materialsMap.get(lines[0].materialId) ?? null
    : null;

  const project = await resolveProjectFields(supabase, organizationId, body.projectId);

  let bonLocationNo = formatBonLocationNo(body.bonLocationNo ?? body.contractNo ?? "");
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

  const payload = buildPayload(body, project, bonLocationNo, primaryMaterial, lines);

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
