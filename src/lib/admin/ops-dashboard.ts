import { computeStockStatus, type DashboardOpsStats } from "@/components/admin/operations-types";
import { isGasoilStockItem } from "@/lib/admin/gasoil-stock";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export async function getDashboardOpsStats(organizationId: string): Promise<DashboardOpsStats> {
  const supabase = getSupabaseAdminClient();
  const monthStart = startOfMonth();

  try {
    const [
      stockRes,
      pendingDaRes,
      fuelRes,
      drillRes,
      tripsRes,
      employeesRes,
      prodRes,
      partsRes,
      rentalsRes,
    ] = await Promise.all([
      supabase
        .from("admin_stock_items")
        .select("qty, min_qty, category, reference, designation")
        .eq("organization_id", organizationId),
      supabase
        .from("admin_purchase_requests")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "pending"),
      supabase
        .from("admin_fuel_entries")
        .select("litres")
        .eq("organization_id", organizationId)
        .gte("entry_date", monthStart),
      supabase
        .from("admin_drilling_reports")
        .select("depth_start, depth_end")
        .eq("organization_id", organizationId)
        .gte("report_date", monthStart),
      supabase
        .from("admin_trips")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("trip_date", monthStart),
      supabase
        .from("admin_employees")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
      supabase
        .from("admin_production_entries")
        .select("tonnage, target_tonnage")
        .eq("organization_id", organizationId)
        .gte("entry_date", monthStart),
      supabase
        .from("admin_parts_usage")
        .select("qty")
        .eq("organization_id", organizationId)
        .gte("usage_date", monthStart),
      supabase
        .from("admin_rental_contracts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId),
    ]);

    const stockRows = stockRes.data ?? [];
    let stockAlerts = 0;
    let stockItems = 0;
    for (const row of stockRows) {
      if (isGasoilStockItem(row)) continue;
      stockItems += 1;
      const qty = Number(row.qty ?? 0);
      const minQty = Number(row.min_qty ?? 0);
      const status = computeStockStatus(qty, minQty);
      if (status !== "ok") stockAlerts += 1;
    }

    const drillMeters = (drillRes.data ?? []).reduce(
      (acc, r) => acc + Math.max(0, Number(r.depth_end ?? 0) - Number(r.depth_start ?? 0)),
      0,
    );

    const prodRows = prodRes.data ?? [];
    const tonnage = prodRows.reduce((a, r) => a + Number(r.tonnage ?? 0), 0);
    const target = prodRows.reduce((a, r) => a + Number(r.target_tonnage ?? 0), 0);
    const productionRate = target > 0 ? Math.round((tonnage / target) * 100) : 0;

    return {
      stockItems,
      stockAlerts,
      pendingPurchaseRequests: pendingDaRes.count ?? 0,
      fuelLitresMonth: (fuelRes.data ?? []).reduce((a, r) => a + Number(r.litres ?? 0), 0),
      drillingMetersMonth: drillMeters,
      tripsMonth: tripsRes.count ?? 0,
      activeEmployees: employeesRes.count ?? 0,
      productionRate,
      partsUsageMonth: (partsRes.data ?? []).reduce((a, r) => a + Number(r.qty ?? 0), 0),
      rentalEquipment: rentalsRes.count ?? 0,
    };
  } catch {
    return {
      stockItems: 0,
      stockAlerts: 0,
      pendingPurchaseRequests: 0,
      fuelLitresMonth: 0,
      drillingMetersMonth: 0,
      tripsMonth: 0,
      activeEmployees: 0,
      productionRate: 0,
      partsUsageMonth: 0,
      rentalEquipment: 0,
    };
  }
}
