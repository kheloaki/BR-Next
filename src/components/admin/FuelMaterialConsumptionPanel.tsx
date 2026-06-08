"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { FuelEntry, RentalContract } from "@/components/admin/operations-types";
import { GASOIL_VEHICLE_CATEGORIES, GASOIL_VEHICLE_CATEGORY_LABELS } from "@/lib/admin/gasoil-bon";
import { buildMaterialUsageSummary } from "@/lib/admin/material-fuel-usage";
import { fuelEntriesEstimatedPriceLitres } from "@/lib/admin/fuel-bon-sync";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";
import { formatMoney } from "@/lib/admin/price-ht-ttc";
import {
  btnSecondary,
  inputClass,
  labelClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { ReferentialBanner } from "@/components/admin/ux/ReferentialBanner";

function fmtHours(n: number) {
  return `${n.toLocaleString("fr-MA", { maximumFractionDigits: 1 })} h`;
}

function fmtLitres(n: number) {
  return `${n.toLocaleString("fr-MA")} L`;
}

function fmtLitresPerHour(n: number) {
  return `${n.toLocaleString("fr-MA", { maximumFractionDigits: 2 })} L/h`;
}

export function FuelMaterialConsumptionPanel() {
  const [fuelRows, setFuelRows] = useState<FuelEntry[]>([]);
  const [rentalRows, setRentalRows] = useState<RentalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const { projects, materials, loading: refLoading, refresh: refreshRef } = useOpsReferential();

  const load = useCallback(async () => {
    setLoading(true);
    const [fuelRes, rentalsRes] = await Promise.all([
      fetch("/api/admin/fuel", { cache: "no-store" }),
      fetch("/api/admin/rentals", { cache: "no-store" }),
    ]);
    if (fuelRes.ok) setFuelRows((await fuelRes.json()) as FuelEntry[]);
    if (rentalsRes.ok) setRentalRows((await rentalsRes.json()) as RentalContract[]);
    await refreshRef();
    setLoading(false);
  }, [refreshRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeMaterials = useMemo(() => materials.filter((m) => m.active), [materials]);

  const usageFilters = useMemo(
    () => ({
      projectId: filterProjectId || undefined,
      materialName: filterMaterial || undefined,
      category: filterCategory || undefined,
      driver: filterDriver || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    }),
    [filterProjectId, filterMaterial, filterCategory, filterDriver, filterDateFrom, filterDateTo],
  );

  const { rows: materialUsage, totalUnpricedLitres } = useMemo(() => {
    return buildMaterialUsageSummary(fuelRows, rentalRows, materials, usageFilters);
  }, [fuelRows, rentalRows, materials, usageFilters]);

  const filteredUsage = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materialUsage;
    return materialUsage.filter((row) => row.label.toLowerCase().includes(q));
  }, [materialUsage, search]);

  const materialFilterOptions = useMemo(() => {
    const labels = new Set<string>();
    for (const m of activeMaterials) labels.add(materialLabel(m));
    for (const row of materialUsage) labels.add(row.label);
    return [...labels].sort((a, b) => a.localeCompare(b, "fr"));
  }, [activeMaterials, materialUsage]);

  const driverOptions = useMemo(() => {
    const names = new Set<string>();
    for (const r of fuelRows) if (r.fueledBy.trim()) names.add(r.fueledBy.trim());
    for (const r of rentalRows) if (r.driverName.trim()) names.add(r.driverName.trim());
    return [...names].sort((a, b) => a.localeCompare(b, "fr"));
  }, [fuelRows, rentalRows]);

  const hasActiveFilters =
    filterProjectId !== "" ||
    filterCategory !== "" ||
    filterMaterial !== "" ||
    filterDriver !== "" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  const totalHours = filteredUsage.reduce((a, r) => a + r.totalHours, 0);
  const totalLitres = filteredUsage.reduce((a, r) => a + r.totalLitres, 0);
  const totalRentalMad = filteredUsage.reduce((a, r) => a + r.totalRentalMad, 0);
  const totalCost = filteredUsage.reduce((a, r) => a + r.totalCostMad, 0);
  const totalOperating = totalRentalMad + totalCost;
  const avgCostPerHour = totalHours > 0 && totalCost > 0 ? totalCost / totalHours : null;
  const avgRentalPerHour = totalHours > 0 && totalRentalMad > 0 ? totalRentalMad / totalHours : null;
  const avgOperatingPerHour = totalHours > 0 && totalOperating > 0 ? totalOperating / totalHours : null;
  const avgLitresPerHour = totalHours > 0 && totalLitres > 0 ? totalLitres / totalHours : null;
  const hasPricedConsumption = totalCost > 0;
  const estimatedPriceLitres = useMemo(
    () => fuelEntriesEstimatedPriceLitres(fuelRows),
    [fuelRows],
  );

  if (refLoading || loading) {
    return (
      <div className={moduleWrap}>
        <OpsModuleHeader
          title="Analyse consommation & location matériel"
          description="Heures location, gasoil consommé et coût par heure travaillée — par matériel."
        />
        <AdminLoading />
      </div>
    );
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Analyse consommation & location matériel"
        description="Croise les bons location (heures + coût HT) et les bons de sortie gasoil (L, MAD/h) par matériel."
        actions={
          <>
            <Link href="/admin/equipment-rental/bons" className={btnSecondary}>
              Bons location
            </Link>
            <Link href="/admin/fuel/stock?tab=journal" className={btnSecondary}>
              Journal consommation
            </Link>
          </>
        }
      />

      <ReferentialBanner
        sitesCount={projects.length}
        equipmentCount={activeMaterials.length}
        requireSites
        requireEquipment
      />

      <div className="mb-4 rounded-lg border border-border bg-white px-4 py-3 text-sm text-[var(--graphite)]/85">
        Coût gasoil calculé à partir du <span className="font-medium text-[var(--navy)]">prix appliqué</span> sur
        chaque bon de sortie. Si le bon n&apos;a pas de prix, le système utilise le{" "}
        <span className="font-medium text-[var(--navy)]">prix moyen des achats stock</span> (traitements / BC gasoil).
      </div>

      {estimatedPriceLitres > 0 ? (
        <div className="mb-4 rounded-lg border border-sky-200/80 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          {fmtLitres(estimatedPriceLitres)} estimés au prix moyen stock (bons de sortie sans prix enregistré). Pour
          un coût exact par bon, saisissez le prix sur chaque{" "}
          <Link href="/admin/fuel/bons" className="font-medium underline underline-offset-2">
            bon de sortie
          </Link>
          .
        </div>
      ) : null}

      {totalUnpricedLitres > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {fmtLitres(totalUnpricedLitres)} sans prix enregistré sur le bon ou le mouvement stock. Les coûts
          affichés concernent uniquement les bons avec prix connu ; complétez les{" "}
            <Link href="/admin/traitements-achat" className="font-medium underline underline-offset-2">
              traitements achat gasoil
            </Link>{" "}
          et les sorties récentes pour un calcul complet.
        </div>
      ) : null}

      <AdminMiniStats
        items={[
          { label: "Matériels suivis", value: String(filteredUsage.length) },
          { label: "Heures location", value: fmtHours(totalHours) },
          { label: "Location (HT)", value: totalRentalMad > 0 ? formatMoney(totalRentalMad) : "—" },
          { label: "Gasoil consommé", value: fmtLitres(totalLitres) },
          {
            label: "Moy. L/h",
            value: avgLitresPerHour != null ? fmtLitresPerHour(avgLitresPerHour) : "—",
          },
          {
            label: "Moy. MAD/h gasoil",
            value: avgCostPerHour != null ? formatMoney(avgCostPerHour) : "—",
          },
          {
            label: "Moy. MAD/h total",
            value: avgOperatingPerHour != null ? formatMoney(avgOperatingPerHour) : "—",
          },
        ]}
      />

      <AdminInventoryCard
        title={`Consommation & location par matériel${hasActiveFilters || search ? ` (${filteredUsage.length})` : ""}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Matériel…"
      >
        <div className="flex flex-wrap items-end gap-2 border-b border-border px-4 py-3">
          <div>
            <p className={labelClass}>Chantier</p>
            <select
              className={`${inputClass} mt-1 min-w-[160px]`}
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
            >
              <option value="">Tous chantiers</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelClass}>Catégorie</p>
            <select
              className={`${inputClass} mt-1 min-w-[160px]`}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Toutes catégories</option>
              {GASOIL_VEHICLE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {GASOIL_VEHICLE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelClass}>Matériel</p>
            <select
              className={`${inputClass} mt-1 min-w-[200px]`}
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
            >
              <option value="">Tout matériel</option>
              {materialFilterOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelClass}>Conducteur</p>
            <select
              className={`${inputClass} mt-1 min-w-[160px]`}
              value={filterDriver}
              onChange={(e) => setFilterDriver(e.target.value)}
            >
              <option value="">Tous conducteurs</option>
              {driverOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelClass}>Du</p>
            <input
              type="date"
              className={`${inputClass} mt-1 min-w-[140px]`}
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div>
            <p className={labelClass}>Au</p>
            <input
              type="date"
              className={`${inputClass} mt-1 min-w-[140px]`}
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              className={`${btnSecondary} mt-5`}
              onClick={() => {
                setFilterProjectId("");
                setFilterCategory("");
                setFilterMaterial("");
                setFilterDriver("");
                setFilterDateFrom("");
                setFilterDateTo("");
              }}
            >
              Tout effacer
            </button>
          ) : null}
        </div>

        {filteredUsage.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
            Aucune donnée location ou carburant pour les filtres sélectionnés.
          </div>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <th className={thClass}>Matériel</th>
                <th className={thClass}>Heures</th>
                <th className={thClass}>Location HT</th>
                <th className={thClass}>MAD/h loc.</th>
                <th className={thClass}>Gasoil (L)</th>
                <th className={thClass}>L / h</th>
                <th className={thClass}>Coût gasoil</th>
                <th className={thClass}>MAD/h gasoil</th>
                <th className={thClass}>Total MAD/h</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsage.map((row) => (
                <tr key={row.key} className={rowHover}>
                  <td className={tdClass}>{row.label}</td>
                  <td className={`${tdClass} tabular-nums`}>
                    {row.totalHours > 0 ? fmtHours(row.totalHours) : "—"}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>
                    {row.totalRentalMad > 0 ? formatMoney(row.totalRentalMad) : "—"}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>
                    {row.rentalMadPerHour != null ? formatMoney(row.rentalMadPerHour) : "—"}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>
                    {row.totalLitres > 0 ? fmtLitres(row.totalLitres) : "—"}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>
                    {row.litresPerHour != null ? fmtLitresPerHour(row.litresPerHour) : "—"}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>
                    {row.totalCostMad > 0 ? formatMoney(row.totalCostMad) : "—"}
                  </td>
                  <td className={`${tdClass} tabular-nums`}>
                    {row.costPerHourMad != null ? formatMoney(row.costPerHourMad) : "—"}
                  </td>
                  <td className={`${tdClass} tabular-nums font-medium text-[var(--navy)]`}>
                    {row.operatingMadPerHour != null ? formatMoney(row.operatingMadPerHour) : "—"}
                  </td>
                </tr>
              ))}
              <tr className="bg-[var(--background)]/60 font-medium">
                <td className={tdClass}>Total / moyenne</td>
                <td className={`${tdClass} tabular-nums`}>{fmtHours(totalHours)}</td>
                <td className={`${tdClass} tabular-nums`}>
                  {totalRentalMad > 0 ? formatMoney(totalRentalMad) : "—"}
                </td>
                <td className={`${tdClass} tabular-nums`}>
                  {avgRentalPerHour != null ? formatMoney(avgRentalPerHour) : "—"}
                </td>
                <td className={`${tdClass} tabular-nums`}>{fmtLitres(totalLitres)}</td>
                <td className={`${tdClass} tabular-nums`}>
                  {avgLitresPerHour != null ? fmtLitresPerHour(avgLitresPerHour) : "—"}
                </td>
                <td className={`${tdClass} tabular-nums`}>
                  {hasPricedConsumption ? formatMoney(totalCost) : "—"}
                </td>
                <td className={`${tdClass} tabular-nums`}>
                  {avgCostPerHour != null ? formatMoney(avgCostPerHour) : "—"}
                </td>
                <td className={`${tdClass} tabular-nums`}>
                  {avgOperatingPerHour != null ? formatMoney(avgOperatingPerHour) : "—"}
                </td>
              </tr>
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>
    </div>
  );
}
