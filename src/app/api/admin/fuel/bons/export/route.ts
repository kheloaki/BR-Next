import { NextResponse } from "next/server";
import type { GasoilBonType, GasoilVehicleCategory } from "@/components/admin/operations-types";
import {
  buildGasoilBonExportData,
  gasoilBonExportFilename,
} from "@/lib/admin/gasoil-bon-export-data";
import { gasoilBonExcelBytes } from "@/lib/admin/gasoil-bon-excel";
import { gasoilBonPdfBytes } from "@/lib/admin/gasoil-bon-pdf";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function mapBonRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    number: r.number as string,
    bonType: r.bon_type as GasoilBonType,
    vehicleCategory: r.vehicle_category as GasoilVehicleCategory,
    projectId: (r.project_id as string) || null,
    materialId: (r.material_id as string) || null,
    equipmentId: (r.equipment_id as string) || null,
    vehicleLabel: (r.vehicle_label as string) || "",
    equipmentName: (r.equipment_name as string) || "",
    siteName: (r.site_name as string) || "",
    bonDate: r.bon_date as string,
    litres: Number(r.litres ?? 0),
    pumpMeter: r.pump_meter != null ? Number(r.pump_meter) : null,
    supplier: (r.supplier as string) || "",
    beneficiary: (r.beneficiary as string) || "",
    driverContactId: (r.driver_contact_id as string) || null,
    pompisteContactId: (r.pompiste_contact_id as string) || null,
    fuelTime: (r.fuel_time as string) || "",
    deliveryNote: (r.delivery_note as string) || "",
    notes: (r.notes as string) || "",
    fuelEntryId: (r.fuel_entry_id as string) || null,
    createdAt: r.created_at as string,
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  const format = searchParams.get("format")?.trim().toLowerCase();

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (format !== "pdf" && format !== "excel") {
    return NextResponse.json({ error: "format must be pdf or excel" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: row, error } = await supabase
    .from("admin_gasoil_bons")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Bon introuvable" }, { status: 404 });

  const bon = mapBonRow(row as Record<string, unknown>);
  let projectName = bon.siteName;
  if (bon.projectId) {
    const { data: project } = await supabase
      .from("admin_projects")
      .select("name")
      .eq("id", bon.projectId)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (project?.name) projectName = project.name as string;
  }

  const exportData = buildGasoilBonExportData(bon, projectName);

  if (format === "pdf") {
    const bytes = await gasoilBonPdfBytes(exportData);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${gasoilBonExportFilename(bon.number, "pdf", bon.bonType)}"`,
      },
    });
  }

  const bytes = gasoilBonExcelBytes(exportData);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${gasoilBonExportFilename(bon.number, "xls", bon.bonType)}"`,
    },
  });
}
