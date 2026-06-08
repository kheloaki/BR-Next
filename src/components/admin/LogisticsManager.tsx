"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { TripStatusBadge } from "@/components/admin/StatusBadge";
import type { Trip, TripStatus } from "@/components/admin/operations-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function LogisticsManager() {
  const toast = useAdminToast();
  const searchParams = useSearchParams();
  const { projects } = useOpsReferential();
  const [tab, setTab] = useState("trips");
  const [rows, setRows] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState(searchParams.get("project") ?? "");
  const [vehicleCode, setVehicleCode] = useState("");
  const [driverName, setDriverName] = useState("");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [distanceKm, setDistanceKm] = useState(0);
  const [status, setStatus] = useState<TripStatus>("in_transit");
  const [tripDate, setTripDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/trips", { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as Trip[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "new") setTab("new");
  }, [searchParams]);

  const totalKm = rows.reduce((a, r) => a + r.distanceKm, 0);
  const inTransit = rows.filter((r) => r.status === "in_transit").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.vehicleCode.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.departure.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function submit() {
    if (!vehicleCode.trim() || !departure.trim() || !destination.trim()) {
      toast.error("Véhicule, départ et destination sont requis.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tripDate,
        projectId: projectId || undefined,
        vehicleCode,
        driverName,
        departure,
        destination,
        distanceKm,
        status,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Voyage enregistré.");
    setVehicleCode("");
    setDriverName("");
    setDeparture("");
    setDestination("");
    setDistanceKm(0);
    await load();
    setTab("trips");
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Logistique & voyages"
        description="Pointage des trajets et livraisons."
        exportHref="/api/admin/trips?format=csv"
        actions={
          <button type="button" className={btnPrimary} onClick={() => setTab("new")}>
            Nouveau trajet
          </button>
        }
      />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Voyages", value: String(rows.length) },
            { label: "En route", value: String(inTransit), accent: inTransit > 0 ? "alert" : undefined },
            { label: "Km total", value: `${totalKm.toLocaleString("fr-MA")} km` },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "trips", label: "Voyages", badge: rows.length || undefined },
          { id: "new", label: "Nouveau trajet" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <AdminLoading /> : null}

      {!loading && tab === "trips" ? (
        <AdminInventoryCard
          title="Liste des voyages"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Véhicule, chauffeur, trajet…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucun voyage enregistré."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setTab("new")}>
                Nouveau trajet
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Véhicule</th>
                  <th className={thClass}>Chauffeur</th>
                  <th className={thClass}>Trajet</th>
                  <th className={thClass}>Km</th>
                  <th className={thClass}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>{r.tripDate}</td>
                    <td className={tdClass}>{r.vehicleCode}</td>
                    <td className={tdClass}>{r.driverName || "—"}</td>
                    <td className={tdClass}>
                      {r.departure} → {r.destination}
                    </td>
                    <td className={tdClass}>{r.distanceKm}</td>
                    <td className={tdClass}>
                      <TripStatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {!loading && tab === "new" ? (
        <AdminFormCard
          title="Nouveau voyage"
          footer={
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          }
        >
          <div className="max-w-md space-y-2">
            <input type="date" className={inputClass} value={tripDate} onChange={(e) => setTripDate(e.target.value)} />
            <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} allowEmpty />
            <input className={inputClass} placeholder="Code véhicule *" value={vehicleCode} onChange={(e) => setVehicleCode(e.target.value)} />
            <input className={inputClass} placeholder="Chauffeur" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
            <input className={inputClass} placeholder="Départ *" value={departure} onChange={(e) => setDeparture(e.target.value)} />
            <input className={inputClass} placeholder="Destination *" value={destination} onChange={(e) => setDestination(e.target.value)} />
            <input type="number" className={inputClass} placeholder="Distance km" value={distanceKm || ""} onChange={(e) => setDistanceKm(Number(e.target.value) || 0)} />
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as TripStatus)}>
              <option value="in_transit">En route</option>
              <option value="arrived">Arrivé</option>
              <option value="delivered">Livré</option>
            </select>
          </div>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
