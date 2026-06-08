"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { FuelEntry } from "@/components/admin/operations-types";
import { GASOIL_VEHICLE_CATEGORIES, GASOIL_VEHICLE_CATEGORY_LABELS } from "@/lib/admin/gasoil-bon";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";

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

  const materialOptions = useMemo(() => {
    return [...new Set(rows.map((r) => r.equipmentName.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [rows]);

  const driverOptions = useMemo(() => {
    return [...new Set(rows.map((r) => r.fueledBy.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [rows]);

  const hasActiveFilters =
    filterProjectId !== "" ||
    filterCategory !== "" ||
    filterMaterial !== "" ||
    filterDriver !== "" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  const filtered = useMemo(() => {
    let list = rows;
    if (filterProjectId) list = list.filter((r) => r.projectId === filterProjectId);
    if (filterCategory) list = list.filter((r) => r.vehicleCategory === filterCategory);
    if (filterMaterial) list = list.filter((r) => r.equipmentName.trim() === filterMaterial);
    if (filterDriver) list = list.filter((r) => r.fueledBy.trim() === filterDriver);
    if (filterDateFrom) list = list.filter((r) => r.entryDate.slice(0, 10) >= filterDateFrom);
    if (filterDateTo) list = list.filter((r) => r.entryDate.slice(0, 10) <= filterDateTo);

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
  }, [
    rows,
    search,
    projects,
    filterProjectId,
    filterCategory,
    filterMaterial,
    filterDriver,
    filterDateFrom,
    filterDateTo,
  ]);

  if (loading) return <AdminLoading />;

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
              className={`${inputClass} mt-1 min-w-[180px]`}
              value={filterMaterial}
              onChange={(e) => setFilterMaterial(e.target.value)}
            >
              <option value="">Tout matériel</option>
              {materialOptions.map((name) => (
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
                  <td className={tdClass}>{r.entryDate}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{r.ticketNo || "—"}</td>
                  <td className={tdClass}>
                    {r.vehicleCategory ? GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory] : "—"}
                  </td>
                  <td className={tdClass}>{r.equipmentName}</td>
                  <td className={tdClass}>{r.litres.toLocaleString("fr-MA")} L</td>
                  <td className={tdClass}>{r.siteName || projectName(r.projectId)}</td>
                  <td className={tdClass}>
                    {r.meterStart != null ? r.meterStart.toLocaleString("fr-MA") : "—"}
                  </td>
                  <td className={tdClass}>{r.fuelTime || "—"}</td>
                  <td className={tdClass}>{r.fueledBy || "—"}</td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>
    </div>
  );
}
