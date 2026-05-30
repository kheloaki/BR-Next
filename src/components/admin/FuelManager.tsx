"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { EquipmentSelect } from "@/components/admin/EquipmentSelect";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { FuelEntry } from "@/components/admin/operations-types";
import type { FuelView } from "@/lib/admin/fuel-nav";
import { FUEL_VIEW_META } from "@/lib/admin/fuel-nav";
import {
  btnPrimary,
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
import { OpsPerfBars } from "@/components/admin/ux/OpsPerfBars";
import { ReferentialBanner } from "@/components/admin/ux/ReferentialBanner";
import { FuelGasoilDaPanel } from "@/components/admin/FuelGasoilDaPanel";
import { FuelGasoilBonPanel } from "@/components/admin/FuelGasoilBonPanel";
import { FuelGasoilStockPanel } from "@/components/admin/FuelGasoilStockPanel";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function FuelManager({ view }: { view: FuelView }) {
  const toast = useAdminToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const meta = FUEL_VIEW_META[view];

  const [gasoilStockQty, setGasoilStockQty] = useState<number | null>(null);
  const [rows, setRows] = useState<FuelEntry[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(view === "journal" || view === "stats");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const { projects, equipment, refresh: refreshRef } = useOpsReferential();
  const [equipmentId, setEquipmentId] = useState("");
  const [litres, setLitres] = useState(0);
  const [projectId, setProjectId] = useState(searchParams.get("project") ?? "");
  const [ticketNo, setTicketNo] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));

  const loadSummary = useCallback(async () => {
    const [fuelRes, stockRes] = await Promise.all([
      fetch("/api/admin/fuel", { cache: "no-store" }),
      fetch("/api/admin/fuel/stock", { cache: "no-store" }),
    ]);
    if (fuelRes.ok) setRows((await fuelRes.json()) as FuelEntry[]);
    if (stockRes.ok) {
      const { item } = (await stockRes.json()) as { item: { qty: number } | null };
      setGasoilStockQty(item?.qty ?? null);
    }
  }, []);

  const loadJournal = useCallback(async () => {
    setLoadingJournal(true);
    await loadSummary();
    await refreshRef();
    setLoadingJournal(false);
  }, [loadSummary, refreshRef]);

  useEffect(() => {
    if (view === "journal" || view === "stats") void loadJournal();
  }, [view, loadJournal]);

  useEffect(() => {
    const p = searchParams.get("project");
    if (p) setProjectId(p);
  }, [searchParams]);

  const byEquipment = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const k = r.equipmentName || "—";
      map.set(k, (map.get(k) ?? 0) + r.litres);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const totalLitres = rows.reduce((a, r) => a + r.litres, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.equipmentName.toLowerCase().includes(q) ||
        r.siteName.toLowerCase().includes(q) ||
        r.ticketNo.toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function submit() {
    if (!equipmentId) {
      toast.error("Sélectionnez un engin.");
      return;
    }
    if (litres <= 0) {
      toast.error("Indiquez une quantité en litres.");
      return;
    }
    setSaving(true);
    const eq = equipment.find((e) => e.id === equipmentId);
    const res = await fetch("/api/admin/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipmentId,
        equipmentName: eq?.name || "",
        entryDate,
        litres,
        projectId,
        ticketNo,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Saisie carburant enregistrée.");
    setLitres(0);
    setTicketNo("");
    router.push("/admin/fuel/journal");
  }

  const showBanner = view === "journal" || view === "saisie" || view === "stats";
  const showSummaryStats = view === "journal";

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title={meta.title}
        description={meta.description}
        exportHref={meta.exportHref}
        actions={
          view === "journal" ? (
            <Link href="/admin/fuel/saisie" className={btnPrimary}>
              Nouvelle saisie
            </Link>
          ) : undefined
        }
      />

      {showBanner ? (
        <ReferentialBanner
          sitesCount={projects.length}
          equipmentCount={equipment.length}
          requireSites
          requireEquipment
        />
      ) : null}

      {showSummaryStats && !loadingJournal ? (
        <AdminMiniStats
          items={[
            {
              label: "Stock gasoil",
              value: gasoilStockQty != null ? `${gasoilStockQty.toLocaleString("fr-MA")} L` : "—",
            },
            { label: "Litres consommés", value: `${totalLitres.toLocaleString("fr-MA")} L` },
            { label: "Saisies journal", value: String(rows.length) },
          ]}
        />
      ) : null}

      {view === "stock" ? (
        <FuelGasoilStockPanel projects={projects} onUpdated={() => void loadSummary()} />
      ) : null}

      {view === "bons" ? (
        <FuelGasoilBonPanel
          projects={projects}
          equipment={equipment}
          projectIdFromUrl={searchParams.get("project") ?? undefined}
          onStockUpdated={() => void loadSummary()}
        />
      ) : null}

      {view === "da-gasoil" ? (
        <FuelGasoilDaPanel
          projects={projects}
          projectIdFromUrl={searchParams.get("project") ?? undefined}
        />
      ) : null}

      {view === "stats" ? (
        loadingJournal ? (
          <AdminLoading />
        ) : (
          <OpsPerfBars items={byEquipment.map(([label, value]) => ({ label, value, suffix: " L" }))} />
        )
      ) : null}

      {view === "journal" ? (
        loadingJournal ? (
          <AdminLoading />
        ) : (
          <AdminInventoryCard
            title="Journal carburant"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Engin, site, ticket…"
          >
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                {search ? "Aucun résultat pour ce filtre." : "Aucune saisie carburant enregistrée."}
                <Link href="/admin/fuel/saisie" className={`mt-4 inline-block ${btnPrimary}`}>
                  Nouvelle saisie
                </Link>
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Engin</th>
                    <th className={thClass}>Litres</th>
                    <th className={thClass}>Site</th>
                    <th className={thClass}>Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className={rowHover}>
                      <td className={tdClass}>{r.entryDate}</td>
                      <td className={tdClass}>{r.equipmentName}</td>
                      <td className={tdClass}>{r.litres.toLocaleString("fr-MA")}</td>
                      <td className={tdClass}>{r.siteName || "—"}</td>
                      <td className={tdClass}>{r.ticketNo || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
        )
      ) : null}

      {view === "saisie" ? (
        <AdminFormCard
          title="Nouvelle saisie"
          hint="Les engins se gèrent dans Matériel location."
          footer={
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          }
        >
          <div className="max-w-md space-y-2">
            <input type="date" className={inputClass} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            <EquipmentSelect equipment={equipment} value={equipmentId} onChange={setEquipmentId} />
            <input
              type="number"
              className={inputClass}
              placeholder="Litres *"
              value={litres || ""}
              onChange={(e) => setLitres(Number(e.target.value) || 0)}
            />
            <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
            <input className={inputClass} placeholder="N° ticket" value={ticketNo} onChange={(e) => setTicketNo(e.target.value)} />
          </div>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
