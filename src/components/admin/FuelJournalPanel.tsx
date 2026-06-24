"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FrenchDateInput } from "@/components/admin/FrenchDateTimeInput";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { enumToOptions, stringOptions, withEmptyOption } from "@/components/admin/searchable-options";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { FuelEntry } from "@/components/admin/operations-types";
import { formatDateFr, formatTimeFr24 } from "@/lib/admin/date-time-fr";
import {
  applyFacetScope,
  facetEnumOptions,
  facetStringOptions,
  projectsForFacetScope,
  pruneFilterValue,
  pruneProjectId,
} from "@/lib/admin/filter-scope";
import { GASOIL_VEHICLE_CATEGORIES, GASOIL_VEHICLE_CATEGORY_LABELS } from "@/lib/admin/gasoil-bon";
import {
  btnPrimary,
  btnSecondary,
  filterBarClass,
  filterFieldWrap,
  filterInputClass,
  labelClass,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { FuelJournalPanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";

export function FuelJournalPanel({ gasoilStockQty }: { gasoilStockQty: number | null }) {
  const [rows, setRows] = useState<FuelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const { projects, refresh: refreshRef } = useOpsReferential();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/fuel", { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as FuelEntry[]);
    await refreshRef();
    setLoading(false);
  }, [refreshRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalLitres = rows.reduce((a, r) => a + r.litres, 0);

  const projectName = (id: string | null) => {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.name ?? "—";
  };

  const fuelFacetChecks = useMemo(
    () => [
      {
        key: "projectId",
        active: filterProjectId,
        test: (r: FuelEntry) => r.projectId === filterProjectId,
      },
      {
        key: "category",
        active: filterCategory,
        test: (r: FuelEntry) => r.vehicleCategory === filterCategory,
      },
      {
        key: "material",
        active: filterMaterial,
        test: (r: FuelEntry) => r.equipmentName.trim() === filterMaterial,
      },
      {
        key: "driver",
        active: filterDriver,
        test: (r: FuelEntry) => r.fueledBy.trim() === filterDriver,
      },
      {
        key: "dates",
        active: filterDateFrom || filterDateTo ? "1" : "",
        test: (r: FuelEntry) => {
          const d = r.entryDate.slice(0, 10);
          if (filterDateFrom && d < filterDateFrom) return false;
          if (filterDateTo && d > filterDateTo) return false;
          return true;
        },
      },
    ],
    [filterProjectId, filterCategory, filterMaterial, filterDriver, filterDateFrom, filterDateTo],
  );

  const scopeFor = useCallback(
    (excludeKey: string) => applyFacetScope(rows, fuelFacetChecks, excludeKey),
    [rows, fuelFacetChecks],
  );

  const filterProjects = useMemo(
    () => projectsForFacetScope(projects, scopeFor("projectId")),
    [projects, scopeFor],
  );

  const materialOptions = useMemo(
    () => facetStringOptions(scopeFor("material"), rows.length, (r) => r.equipmentName),
    [scopeFor, rows.length],
  );

  const driverOptions = useMemo(
    () => facetStringOptions(scopeFor("driver"), rows.length, (r) => r.fueledBy),
    [scopeFor, rows.length],
  );

  const categoryOptions = useMemo(
    () =>
      facetEnumOptions(
        GASOIL_VEHICLE_CATEGORIES,
        scopeFor("category"),
        rows.length,
        (r) => r.vehicleCategory ?? null,
      ),
    [scopeFor, rows.length],
  );

  const categoryLabelOptions = useMemo(() => {
    const labels: Partial<Record<(typeof GASOIL_VEHICLE_CATEGORIES)[number], string>> = {};
    for (const category of categoryOptions) labels[category] = GASOIL_VEHICLE_CATEGORY_LABELS[category];
    return labels as Record<(typeof GASOIL_VEHICLE_CATEGORIES)[number], string>;
  }, [categoryOptions]);

  useEffect(() => {
    setFilterProjectId((current) => pruneProjectId(current, filterProjects));
    setFilterMaterial((current) => pruneFilterValue(current, materialOptions));
    setFilterDriver((current) => pruneFilterValue(current, driverOptions));
    setFilterCategory((current) => pruneFilterValue(current, categoryOptions));
  }, [filterProjects, materialOptions, driverOptions, categoryOptions]);

  const hasActiveFilters =
    filterProjectId !== "" ||
    filterCategory !== "" ||
    filterMaterial !== "" ||
    filterDriver !== "" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  const filtered = useMemo(() => {
    let list = applyFacetScope(rows, fuelFacetChecks);

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const category = r.vehicleCategory ? GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory] : "";
      return (
        r.equipmentName.toLowerCase().includes(q) ||
        r.siteName.toLowerCase().includes(q) ||
        projectName(r.projectId).toLowerCase().includes(q) ||
        r.ticketNo.toLowerCase().includes(q) ||
        (r.vehicleLabel ?? "").toLowerCase().includes(q) ||
        r.fueledBy.toLowerCase().includes(q) ||
        r.entryDate.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q)
      );
    });
  }, [rows, search, projects, fuelFacetChecks]);

  const filteredTotals = useMemo(() => {
    let litres = 0;
    for (const row of filtered) litres += row.litres;
    return { litres, count: filtered.length };
  }, [filtered]);

  if (loading) return <FuelJournalPanelSkeleton />;

  return (
    <div className="space-y-4">
      <AdminMiniStats
        items={[
          {
            label: "Stock gasoil",
            value: gasoilStockQty != null ? `${gasoilStockQty.toLocaleString("fr-MA")} L` : "—",
          },
          { label: "Litres consommés", value: `${totalLitres.toLocaleString("fr-MA")} L` },
          { label: "Bons sortie", value: String(rows.length) },
        ]}
      />

      <AdminInventoryCard
        title={`Journal consommation${hasActiveFilters || search ? ` (${filtered.length})` : ""}`}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="N° bon, matériel, chantier, conducteur, date…"
      >
        <div className={filterBarClass}>
          <div className={filterFieldWrap}>
            <p className={labelClass}>Chantier</p>
            <div className="mt-1">
              <ProjectSelect
                projects={filterProjects}
                value={filterProjectId}
                onChange={setFilterProjectId}
                allowEmpty
                placeholder="Tous chantiers"
                activeOnly={false}
              />
            </div>
          </div>
          <div className={filterFieldWrap}>
            <p className={labelClass}>Catégorie</p>
            <SearchableEnumSelect
              options={withEmptyOption(enumToOptions(categoryLabelOptions), "Toutes catégories")}
              value={filterCategory}
              onChange={setFilterCategory}
              placeholder="Toutes catégories"
              inputClassName={filterInputClass}
            />
          </div>
          <div className={filterFieldWrap}>
            <p className={labelClass}>Matériel</p>
            <SearchableSelect
              options={withEmptyOption(stringOptions(materialOptions), "Tout matériel")}
              value={filterMaterial}
              onChange={setFilterMaterial}
              placeholder="Tout matériel"
              inputClassName={filterInputClass}
            />
          </div>
          <div className={filterFieldWrap}>
            <p className={labelClass}>Conducteur</p>
            <SearchableSelect
              options={withEmptyOption(stringOptions(driverOptions), "Tous conducteurs")}
              value={filterDriver}
              onChange={setFilterDriver}
              placeholder="Tous conducteurs"
              inputClassName={filterInputClass}
            />
          </div>
          <div className={filterFieldWrap}>
            <p className={labelClass}>Du</p>
            <FrenchDateInput
              className={filterInputClass}
              value={filterDateFrom}
              onChange={setFilterDateFrom}
            />
          </div>
          <div className={filterFieldWrap}>
            <p className={labelClass}>Au</p>
            <FrenchDateInput
              className={filterInputClass}
              value={filterDateTo}
              onChange={setFilterDateTo}
            />
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              className={`${btnSecondary} w-full xl:w-auto`}
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

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
            {rows.length === 0
              ? "Aucun bon de sortie enregistré."
              : "Aucune entrée ne correspond aux filtres sélectionnés."}
            {!search && !hasActiveFilters ? (
              <Link href="/admin/fuel/bons" className={`mt-4 inline-block ${btnPrimary}`}>
                Créer un bon de sortie
              </Link>
            ) : null}
          </div>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>N° bon</th>
                <th className={thClass}>Catégorie</th>
                <th className={thClass}>Matériel / Matricule</th>
                <th className={thClass}>Litres</th>
                <th className={thClass}>Chantier</th>
                <th className={thClass}>Compteur</th>
                <th className={thClass}>Heure</th>
                <th className={thClass}>Conducteur</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={rowHover}>
                  <td className={tdClass}>{formatDateFr(r.entryDate)}</td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={r.ticketNo} lines={1} />
                  </td>
                  <td className={tdClass}>
                    {r.vehicleCategory ? GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory] : "—"}
                  </td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={r.equipmentName} lines={1} />
                  </td>
                  <td className={tdClass}>{r.litres.toLocaleString("fr-MA")} L</td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={r.siteName || projectName(r.projectId)} lines={1} />
                  </td>
                  <td className={tdClass}>
                    {r.meterStart != null ? r.meterStart.toLocaleString("fr-MA") : "—"}
                  </td>
                  <td className={tdClass}>{formatTimeFr24(r.fuelTime)}</td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={r.fueledBy} lines={1} />
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--navy)]/20 bg-[var(--background)]/60 font-medium">
                <td className={tdClass} colSpan={4}>
                  Total ({filteredTotals.count} bon{filteredTotals.count > 1 ? "s" : ""})
                </td>
                <td className={`${tdClass} tabular-nums text-[var(--navy)]`}>
                  {filteredTotals.litres > 0
                    ? `${filteredTotals.litres.toLocaleString("fr-MA")} L`
                    : "—"}
                </td>
                <td className={tdClass} colSpan={4} />
              </tr>
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>
    </div>
  );
}
