import type { GasoilBon } from "@/components/admin/operations-types";

export type GasoilBonLineForm = {
  id: string;
  bonDate: string;
  materialId: string;
  vehicleLabel: string;
  pumpMeter: string;
  fuelTime: string;
  litres: number | "";
};

export type GasoilBonLineStored = {
  bonDate: string;
  materialId: string | null;
  vehicleLabel: string;
  pumpMeter: number | null;
  fuelTime: string;
  litres: number;
};

function newLineId() {
  return `ln_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyGasoilBonLine(partial?: Partial<GasoilBonLineForm>): GasoilBonLineForm {
  return {
    id: partial?.id ?? newLineId(),
    bonDate: partial?.bonDate ?? new Date().toISOString().slice(0, 10),
    materialId: partial?.materialId ?? "",
    vehicleLabel: partial?.vehicleLabel ?? "",
    pumpMeter: partial?.pumpMeter ?? "",
    fuelTime: partial?.fuelTime ?? "",
    litres: partial?.litres ?? "",
  };
}

export function parseGasoilBonLineItems(raw: unknown): GasoilBonLineStored[] {
  if (!Array.isArray(raw)) return [];
  const out: GasoilBonLineStored[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const litres = Math.max(0, Number(row.litres) || 0);
    if (litres <= 0) continue;
    const pumpRaw = row.pumpMeter ?? row.pump_meter;
    out.push({
      bonDate: String(row.bonDate ?? row.bon_date ?? "").slice(0, 10),
      materialId: (() => {
        const mid = row.materialId ?? row.material_id;
        return mid ? String(mid) : null;
      })(),
      vehicleLabel: String(row.vehicleLabel ?? row.vehicle_label ?? "").trim(),
      pumpMeter:
        pumpRaw != null && pumpRaw !== "" && !Number.isNaN(Number(pumpRaw)) ? Number(pumpRaw) : null,
      fuelTime: String(row.fuelTime ?? row.fuel_time ?? "").trim(),
      litres,
    });
  }
  return out;
}

export function linesFromGasoilBon(row: Pick<
  GasoilBon,
  "bonDate" | "materialId" | "vehicleLabel" | "pumpMeter" | "fuelTime" | "litres" | "lineItems"
>): GasoilBonLineForm[] {
  const stored = row.lineItems?.length ? row.lineItems : null;
  if (stored?.length) {
    return stored.map((l) =>
      emptyGasoilBonLine({
        bonDate: l.bonDate || row.bonDate,
        materialId: l.materialId ?? "",
        vehicleLabel: l.vehicleLabel || "",
        pumpMeter: l.pumpMeter != null ? String(l.pumpMeter) : "",
        fuelTime: l.fuelTime || "",
        litres: l.litres,
      }),
    );
  }
  return [
    emptyGasoilBonLine({
      bonDate: row.bonDate,
      materialId: row.materialId ?? "",
      vehicleLabel: row.vehicleLabel,
      pumpMeter: row.pumpMeter != null ? String(row.pumpMeter) : "",
      fuelTime: row.fuelTime,
      litres: row.litres,
    }),
  ];
}

export function sumGasoilBonLineLitres(lines: GasoilBonLineForm[]): number {
  return lines.reduce((sum, line) => {
    const n = typeof line.litres === "number" ? line.litres : Number(line.litres);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

/** Flatten form lines → DB aggregates + stored JSON. */
export function flattenGasoilBonLines(lines: GasoilBonLineForm[]): {
  litres: number;
  bonDate: string;
  materialId: string;
  vehicleLabel: string;
  pumpMeter: number | null;
  fuelTime: string;
  lineItems: GasoilBonLineStored[];
} | null {
  const filled = lines
    .map((line) => {
      const litres = typeof line.litres === "number" ? line.litres : Number(line.litres);
      if (!Number.isFinite(litres) || litres <= 0) return null;
      const pump = line.pumpMeter.trim();
      return {
        bonDate: line.bonDate || new Date().toISOString().slice(0, 10),
        materialId: line.materialId.trim() || null,
        vehicleLabel: line.vehicleLabel.trim(),
        pumpMeter: pump && !Number.isNaN(Number(pump)) ? Number(pump) : null,
        fuelTime: line.fuelTime.trim(),
        litres,
      } satisfies GasoilBonLineStored;
    })
    .filter((x): x is GasoilBonLineStored => x != null);

  if (!filled.length) return null;

  const primary = filled[0];
  const withEquip = filled.find((l) => l.materialId || l.vehicleLabel) ?? primary;

  return {
    litres: filled.reduce((s, l) => s + l.litres, 0),
    bonDate: primary.bonDate,
    materialId: withEquip.materialId ?? "",
    vehicleLabel: withEquip.vehicleLabel,
    pumpMeter: primary.pumpMeter,
    fuelTime: primary.fuelTime,
    lineItems: filled,
  };
}
