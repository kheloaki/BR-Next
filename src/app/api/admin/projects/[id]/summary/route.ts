import { NextResponse } from "next/server";
import type {
  AttendanceRecord,
  DrillingReport,
  FuelEntry,
  PartsUsage,
  ProductionEntry,
  ProjectSummary,
  PurchaseRequest,
  Trip,
} from "@/components/admin/operations-types";
import { mapRentalContractRow } from "@/lib/admin/map-rental-material";
import { mapAdminProjectRow } from "@/lib/admin/map-project";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

async function rowsForProject(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  organizationId: string,
  table: string,
  projectId: string,
  orderCol: string,
  limit = 8,
) {
  const { data } = await supabase
    .from(table)
    .select("*")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .order(orderCol, { ascending: false })
    .limit(200);

  const all = data ?? [];
  return { all, recent: all.slice(0, limit) };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { userId, organizationId } = auth;
  const { id } = await context.params;

  const supabase = getSupabaseAdminClient();
  const { data: projectRow, error: projectErr } = await supabase
    .from("admin_projects")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (projectErr) return NextResponse.json({ error: projectErr.message }, { status: 500 });
  if (!projectRow) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  const project = mapAdminProjectRow(projectRow as Record<string, unknown>);

  const [fuel, prod, drill, att, parts, trips, da, rentals, stock] = await Promise.all([
    rowsForProject(supabase, organizationId, "admin_fuel_entries", id, "entry_date"),
    rowsForProject(supabase, organizationId, "admin_production_entries", id, "entry_date"),
    rowsForProject(supabase, organizationId, "admin_drilling_reports", id, "report_date"),
    rowsForProject(supabase, organizationId, "admin_attendance", id, "record_date"),
    rowsForProject(supabase, organizationId, "admin_parts_usage", id, "usage_date"),
    rowsForProject(supabase, organizationId, "admin_trips", id, "trip_date"),
    rowsForProject(supabase, organizationId, "admin_purchase_requests", id, "created_at"),
    rowsForProject(supabase, organizationId, "admin_rental_contracts", id, "created_at"),
    supabase
      .from("admin_stock_movements")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("project_id", id),
  ]);

  const mapFuel = (r: Record<string, unknown>): FuelEntry => ({
    id: r.id as string,
    equipmentId: (r.equipment_id as string) || "",
    equipmentName: r.equipment_name as string,
    entryDate: r.entry_date as string,
    litres: Number(r.litres ?? 0),
    meterStart: r.meter_start != null ? Number(r.meter_start) : null,
    meterEnd: r.meter_end != null ? Number(r.meter_end) : null,
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    fueledBy: r.fueled_by as string,
    ticketNo: r.ticket_no as string,
    notes: r.notes as string,
  });

  const mapProd = (r: Record<string, unknown>): ProductionEntry => ({
    id: r.id as string,
    entryDate: r.entry_date as string,
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    tonnage: Number(r.tonnage ?? 0),
    targetTonnage: Number(r.target_tonnage ?? 0),
    material: r.material as string,
    runHours: Number(r.run_hours ?? 0),
    stopHours: Number(r.stop_hours ?? 0),
    stopReason: r.stop_reason as string,
    shippedTonnage: Number(r.shipped_tonnage ?? 0),
    stockTonnage: Number(r.stock_tonnage ?? 0),
    shiftLead: r.shift_lead as string,
    notes: r.notes as string,
  });

  const mapDrill = (r: Record<string, unknown>): DrillingReport => ({
    id: r.id as string,
    reportDate: r.report_date as string,
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    rigName: r.rig_name as string,
    operatorName: r.operator_name as string,
    depthStart: Number(r.depth_start ?? 0),
    depthEnd: Number(r.depth_end ?? 0),
    metersDrilled: Math.max(0, Number(r.depth_end ?? 0) - Number(r.depth_start ?? 0)),
    targetMeters: Number(r.target_meters ?? 0),
    runHours: Number(r.run_hours ?? 0),
    stopHours: Number(r.stop_hours ?? 0),
    diameterMm: r.diameter_mm != null ? Number(r.diameter_mm) : null,
    incidents: r.incidents as string,
  });

  const mapAtt = (r: Record<string, unknown>): AttendanceRecord => ({
    id: r.id as string,
    employeeId: (r.employee_id as string) || "",
    employeeName: r.employee_name as string,
    matricule: r.matricule as string,
    role: r.role as string,
    recordDate: r.record_date as string,
    timeIn: r.time_in as string,
    timeOut: r.time_out as string,
    status: r.status as AttendanceRecord["status"],
    overtimeHours: Number(r.overtime_hours ?? 0),
    siteName: r.site_name as string,
    projectId: (r.project_id as string) || null,
    task: r.task as string,
    notes: r.notes as string,
  });

  const mapParts = (r: Record<string, unknown>): PartsUsage => ({
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    equipmentId: (r.equipment_id as string) || "",
    equipmentName: r.equipment_name as string,
    stockItemId: (r.stock_item_id as string) || null,
    reference: r.reference as string,
    designation: r.designation as string,
    usageType: r.usage_type as PartsUsage["usageType"],
    qty: Number(r.qty ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    usageDate: r.usage_date as string,
  });

  const mapTrip = (r: Record<string, unknown>): Trip => ({
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    tripDate: r.trip_date as string,
    vehicleCode: r.vehicle_code as string,
    plate: r.plate as string,
    driverName: r.driver_name as string,
    departure: r.departure as string,
    destination: r.destination as string,
    loadType: r.load_type as string,
    distanceKm: Number(r.distance_km ?? 0),
    deliveryNote: r.delivery_note as string,
    status: r.status as Trip["status"],
  });

  const mapDa = (r: Record<string, unknown>): PurchaseRequest => ({
    id: r.id as string,
    projectId: (r.project_id as string) || null,
    number: r.number as string,
    category: r.category as PurchaseRequest["category"],
    subject: r.subject as string,
    qty: Number(r.qty ?? 0),
    unitPrice: Number(r.unit_price ?? 0),
    totalAmount: Number(r.total_amount ?? 0),
    supplier: r.supplier as string,
    urgency: r.urgency as string,
    deliveryDate: (r.delivery_date as string) || "",
    justification: r.justification as string,
    requester: r.requester as string,
    status: r.status as PurchaseRequest["status"],
    createdAt: r.created_at as string,
    pumpMeter: r.pump_meter != null ? Number(r.pump_meter) : null,
    stockItemId: (r.stock_item_id as string) || null,
    stockQtyAtRequest: r.stock_qty_snapshot != null ? Number(r.stock_qty_snapshot) : null,
  });

  const mapRental = (r: Record<string, unknown>) => mapRentalContractRow(r);

  const summary: ProjectSummary = {
    project,
    fuel: {
      totalLitres: fuel.all.reduce((a, r) => a + Number(r.litres ?? 0), 0),
      entryCount: fuel.all.length,
      recent: fuel.recent.map(mapFuel),
    },
    production: {
      totalTonnage: prod.all.reduce((a, r) => a + Number(r.tonnage ?? 0), 0),
      targetTonnage: prod.all.reduce((a, r) => a + Number(r.target_tonnage ?? 0), 0),
      entryCount: prod.all.length,
      recent: prod.recent.map(mapProd),
    },
    drilling: {
      totalMeters: drill.all.reduce(
        (a, r) => a + Math.max(0, Number(r.depth_end ?? 0) - Number(r.depth_start ?? 0)),
        0,
      ),
      entryCount: drill.all.length,
      recent: drill.recent.map(mapDrill),
    },
    attendance: {
      presentCount: att.all.filter((r) => r.status === "present").length,
      entryCount: att.all.length,
      recent: att.recent.map(mapAtt),
    },
    parts: {
      totalCost: parts.all.reduce((a, r) => a + Number(r.qty ?? 0) * Number(r.unit_price ?? 0), 0),
      entryCount: parts.all.length,
      recent: parts.recent.map(mapParts),
    },
    trips: {
      totalKm: trips.all.reduce((a, r) => a + Number(r.distance_km ?? 0), 0),
      entryCount: trips.all.length,
      recent: trips.recent.map(mapTrip),
    },
    purchaseRequests: {
      pendingCount: da.all.filter((r) => r.status === "pending").length,
      totalAmount: da.all.reduce((a, r) => a + Number(r.total_amount ?? 0), 0),
      entryCount: da.all.length,
      recent: da.recent.map(mapDa),
    },
    rentals: {
      totalMad: rentals.all.reduce(
        (a, r) => a + Number(r.hourly_rate ?? 0) * Number(r.hours_worked ?? 0),
        0,
      ),
      entryCount: rentals.all.length,
      recent: rentals.recent.map(mapRental),
    },
    stock: { movementCount: (stock.data ?? []).length },
  };

  return NextResponse.json(summary);
}
