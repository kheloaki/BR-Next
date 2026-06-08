import type { FuelEntry, GasoilBonType, StockMovementType } from "@/components/admin/operations-types";
import { fuelEntryCostMad, gasoilBonPriceFields } from "@/lib/admin/gasoil-bon";
import { resolveGasoilUnitPrice } from "@/lib/admin/gasoil-unit-price";
import { GASOIL_STOCK_CATEGORY } from "@/lib/admin/gasoil-stock";
import { getGasoilStockItem } from "@/lib/admin/gasoil-stock-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FuelEntryPriceSource = "bon" | "movement" | "stock" | "none";

function mapBonUnitPrice(r: Record<string, unknown>): number {
  return Math.max(0, Number(r.unit_price ?? 0));
}

function mapBonTotalAmount(r: Record<string, unknown>, litres: number, unitPrice: number): number {
  const stored = Number(r.total_amount ?? 0);
  if (stored > 0) return stored;
  return gasoilBonPriceFields(litres, unitPrice).total_amount;
}

export function mapBonToFuelEntry(
  r: Record<string, unknown>,
  unitPriceOverride?: number,
  priceSource: FuelEntryPriceSource = "bon",
): FuelEntry {
  const litres = Number(r.litres ?? 0);
  const unitPrice = unitPriceOverride != null && unitPriceOverride > 0 ? unitPriceOverride : mapBonUnitPrice(r);
  const totalAmount = mapBonTotalAmount(r, litres, unitPrice);
  const equipmentName =
    ((r.equipment_name as string) || "").trim() ||
    ((r.vehicle_label as string) || "").trim() ||
    "—";
  return {
    id: r.id as string,
    materialId: (r.material_id as string) || "",
    equipmentId: (r.equipment_id as string) || "",
    equipmentName,
    vehicleLabel: (r.vehicle_label as string) || "",
    entryDate: r.bon_date as string,
    litres,
    meterStart: r.pump_meter != null ? Number(r.pump_meter) : null,
    meterEnd: null,
    siteName: (r.site_name as string) || "",
    projectId: (r.project_id as string) || null,
    fueledBy: (r.beneficiary as string) || "",
    ticketNo: (r.number as string) || "",
    notes: (r.notes as string) || "",
    fuelTime: (r.fuel_time as string) || "",
    bonType: r.bon_type as GasoilBonType,
    vehicleCategory: r.vehicle_category as FuelEntry["vehicleCategory"],
    source: "bon",
    unitPrice: unitPrice > 0 ? unitPrice : undefined,
    totalAmount: totalAmount > 0 ? totalAmount : undefined,
    priceSource: unitPrice > 0 ? priceSource : "none",
  };
}

async function loadExitMovementPricesByBonNumber(
  supabase: SupabaseClient,
  organizationId: string,
  bonNumbers: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (bonNumbers.length === 0) return map;

  const numberSet = new Set(bonNumbers);
  const { data, error } = await supabase
    .from("admin_stock_movements")
    .select("unit_price, notes, delivery_note")
    .eq("organization_id", organizationId)
    .eq("movement_type", "exit")
    .eq("category", GASOIL_STOCK_CATEGORY);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const price = Math.max(0, Number(row.unit_price ?? 0));
    if (price <= 0) continue;
    const note = ((row.notes as string) || "").trim();
    const bonFromNote = note.split(" · ")[0]?.trim();
    if (bonFromNote && numberSet.has(bonFromNote) && !map.has(bonFromNote)) {
      map.set(bonFromNote, price);
      continue;
    }
    const deliveryNote = ((row.delivery_note as string) || "").trim();
    if (deliveryNote && numberSet.has(deliveryNote) && !map.has(deliveryNote)) {
      map.set(deliveryNote, price);
    }
  }

  return map;
}

async function loadGasoilStockAverageUnitPrice(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const item = await getGasoilStockItem(supabase, organizationId);
  if (!item?.id) return 0;

  const { data, error } = await supabase
    .from("admin_stock_movements")
    .select("movement_type, qty, unit_price")
    .eq("organization_id", organizationId)
    .eq("item_id", item.id)
    .order("movement_date", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const info = resolveGasoilUnitPrice(
    item,
    (data ?? []).map((row) => ({
      movementType: row.movement_type as StockMovementType,
      qty: Number(row.qty ?? 0),
      unitPrice: Number(row.unit_price ?? 0),
    })),
  );

  return info.unitPricePerLitre > 0 ? info.unitPricePerLitre : 0;
}

/** Journal carburant — bons de sortie uniquement (distribution / consommation). */
export async function loadFuelJournal(
  supabase: SupabaseClient,
  organizationId: string,
  limit = 200,
) {
  const { data, error } = await supabase
    .from("admin_gasoil_bons")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("bon_type", "sortie")
    .order("bon_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Record<string, unknown>[];
  const missingPriceNumbers = rows
    .filter((r) => mapBonUnitPrice(r) <= 0)
    .map((r) => ((r.number as string) || "").trim())
    .filter(Boolean);

  const [movementPrices, stockAverageUnitPrice] = await Promise.all([
    loadExitMovementPricesByBonNumber(supabase, organizationId, missingPriceNumbers),
    loadGasoilStockAverageUnitPrice(supabase, organizationId),
  ]);

  return rows.map((r) => {
    const number = ((r.number as string) || "").trim();
    const storedPrice = mapBonUnitPrice(r);
    const movementPrice = number ? (movementPrices.get(number) ?? 0) : 0;

    if (storedPrice > 0) {
      return mapBonToFuelEntry(r, storedPrice, "bon");
    }
    if (movementPrice > 0) {
      return mapBonToFuelEntry(r, movementPrice, "movement");
    }
    if (stockAverageUnitPrice > 0) {
      return mapBonToFuelEntry(r, stockAverageUnitPrice, "stock");
    }
    return mapBonToFuelEntry(r, undefined, "none");
  });
}

export function sumFuelEntryCostMad(entries: FuelEntry[]): number {
  return entries.reduce((sum, entry) => sum + fuelEntryCostMad(entry), 0);
}

export function fuelEntriesMissingPriceLitres(entries: FuelEntry[]): number {
  return entries.reduce((sum, entry) => {
    if (fuelEntryCostMad(entry) > 0) return sum;
    return sum + Math.max(0, entry.litres);
  }, 0);
}

export function fuelEntriesEstimatedPriceLitres(entries: FuelEntry[]): number {
  return entries.reduce((sum, entry) => {
    if (entry.priceSource === "stock" && entry.litres > 0) return sum + entry.litres;
    return sum;
  }, 0);
}

/** @deprecated Legacy fuel_entries row — kept for project summaries migration only. */
export function mapFuelRow(r: Record<string, unknown>): FuelEntry {
  return {
    id: r.id as string,
    materialId: (r.material_id as string) || "",
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
    notes: (r.notes as string) || "",
    source: "bon",
  };
}

/** Clean up legacy fuel_entry linked to a deleted bon. */
export async function deleteFuelEntryForBon(
  supabase: SupabaseClient,
  organizationId: string,
  bonId: string,
  fuelEntryId?: string | null,
) {
  const FUEL_NOTE_PREFIX = "gasoil_bon:";
  if (fuelEntryId?.trim()) {
    await supabase
      .from("admin_fuel_entries")
      .delete()
      .eq("id", fuelEntryId.trim())
      .eq("organization_id", organizationId);
    return;
  }

  await supabase
    .from("admin_fuel_entries")
    .delete()
    .eq("organization_id", organizationId)
    .eq("notes", `${FUEL_NOTE_PREFIX}${bonId}`);
}
