"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeliveryNoteSelect } from "@/components/admin/DeliveryNoteSelect";
import { EquipmentSelect } from "@/components/admin/EquipmentSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import type {
  AdminEquipment,
  AdminProject,
  GasoilBon,
  GasoilBonType,
  GasoilVehicleCategory,
  StockItem,
} from "@/components/admin/operations-types";
import {
  GASOIL_BON_TYPE_LABELS,
  GASOIL_BON_TYPES,
  GASOIL_VEHICLE_CATEGORIES,
  GASOIL_VEHICLE_CATEGORY_LABELS,
} from "@/lib/admin/gasoil-bon";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  labelClass,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

type PanelTab = "list" | "new";

const BON_TYPE_BADGE: Record<GasoilBonType, string> = {
  achat: "bg-emerald-50 text-emerald-900 border border-emerald-200/80",
  sortie: "bg-amber-50 text-amber-900 border border-amber-200/80",
};

export function FuelGasoilBonPanel({
  projects,
  equipment,
  projectIdFromUrl,
  onStockUpdated,
}: {
  projects: AdminProject[];
  equipment: AdminEquipment[];
  projectIdFromUrl?: string;
  onStockUpdated?: () => void;
}) {
  const toast = useAdminToast();
  const [panelTab, setPanelTab] = useState<PanelTab>("list");
  const [rows, setRows] = useState<GasoilBon[]>([]);
  const [gasoilStock, setGasoilStock] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [bonType, setBonType] = useState<GasoilBonType>("sortie");
  const [vehicleCategory, setVehicleCategory] = useState<GasoilVehicleCategory>("engin");
  const [projectId, setProjectId] = useState(projectIdFromUrl ?? "");
  const [equipmentId, setEquipmentId] = useState("");
  const [vehicleLabel, setVehicleLabel] = useState("");
  const [litres, setLitres] = useState<number | "">("");
  const [bonDate, setBonDate] = useState(new Date().toISOString().slice(0, 10));
  const [pumpMeter, setPumpMeter] = useState("");
  const [supplier, setSupplier] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [notes, setNotes] = useState("");
  const [syncStock, setSyncStock] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.set("bonType", filterType);
    if (filterCategory) params.set("vehicleCategory", filterCategory);
    const qs = params.toString();
    const [bonRes, stockRes] = await Promise.all([
      fetch(`/api/admin/fuel/bons${qs ? `?${qs}` : ""}`, { cache: "no-store" }),
      fetch("/api/admin/fuel/stock", { cache: "no-store" }),
    ]);
    if (bonRes.ok) setRows((await bonRes.json()) as GasoilBon[]);
    if (stockRes.ok) {
      const { item } = (await stockRes.json()) as { item: StockItem | null };
      setGasoilStock(item);
    }
    setLoading(false);
  }, [filterType, filterCategory]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (projectIdFromUrl) setProjectId(projectIdFromUrl);
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (vehicleCategory !== "engin") setEquipmentId("");
  }, [vehicleCategory]);

  const projectName = (id: string | null) => {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.name ?? "—";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.number.toLowerCase().includes(q) ||
        projectName(r.projectId).toLowerCase().includes(q) ||
        r.equipmentName.toLowerCase().includes(q) ||
        r.vehicleLabel.toLowerCase().includes(q) ||
        GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory].toLowerCase().includes(q),
    );
  }, [rows, search, projects]);

  async function submitBon() {
    if (!projectId) {
      toast.error("Sélectionnez un chantier.");
      return;
    }
    const L = typeof litres === "number" ? litres : Number(litres);
    if (!L || L <= 0) {
      toast.error("Indiquez la quantité en litres.");
      return;
    }
    if (vehicleCategory === "engin" && !equipmentId && !vehicleLabel.trim()) {
      toast.error("Sélectionnez un engin ou saisissez une identification.");
      return;
    }
    if (vehicleCategory !== "engin" && !vehicleLabel.trim()) {
      toast.error("Indiquez l'identification du véhicule (immat., n°…).");
      return;
    }

    const eq = equipment.find((e) => e.id === equipmentId);
    setSaving(true);
    const res = await fetch("/api/admin/fuel/bons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bonType,
        vehicleCategory,
        projectId,
        equipmentId: vehicleCategory === "engin" ? equipmentId : undefined,
        equipmentName: eq?.name || "",
        vehicleLabel,
        bonDate,
        litres: L,
        pumpMeter: pumpMeter.trim() ? Number(pumpMeter) : null,
        supplier: bonType === "achat" ? supplier : "",
        beneficiary: bonType === "sortie" ? beneficiary : "",
        deliveryNote,
        notes,
        syncStock,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const created = (await res.json()) as GasoilBon;
    toast.success(`${GASOIL_BON_TYPE_LABELS[created.bonType]} : ${created.number}`);
    setLitres("");
    setPumpMeter("");
    setSupplier("");
    setBeneficiary("");
    setDeliveryNote("");
    setNotes("");
    setVehicleLabel("");
    setEquipmentId("");
    await load();
    onStockUpdated?.();
    setPanelTab("list");
  }

  async function remove(row: GasoilBon) {
    if (!(await confirmDelete(row.number))) return;
    const res = await fetch(`/api/admin/fuel/bons?id=${encodeURIComponent(row.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Bon supprimé.");
    await load();
  }

  if (loading) return <AdminLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-[var(--background)] px-3 py-2 text-sm">
        <span className="text-[var(--graphite)]/70">Stock ins :</span>
        <span className="font-medium text-[var(--navy)]">
          {gasoilStock ? `${gasoilStock.qty.toLocaleString("fr-MA")} L` : "Non configuré"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={panelTab === "list" ? btnPrimary : btnSecondary}
          onClick={() => setPanelTab("list")}
        >
          Liste des bons
        </button>
        <button
          type="button"
          className={panelTab === "new" ? btnPrimary : btnSecondary}
          onClick={() => setPanelTab("new")}
        >
          Nouveau bon gasoil
        </button>
      </div>

      {panelTab === "list" ? (
        <AdminInventoryCard
          title="Bons gasoil"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="N° bon, chantier, véhicule…"
          actions={
            <button type="button" className={btnPrimary} onClick={() => setPanelTab("new")}>
              Nouveau bon
            </button>
          }
        >
          <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
            <select
              className={`${inputClass} max-w-[160px]`}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Tous types</option>
              {GASOIL_BON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {GASOIL_BON_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              className={`${inputClass} max-w-[200px]`}
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

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              Aucun bon gasoil.
              <button type="button" className={`mt-4 block mx-auto ${btnPrimary}`} onClick={() => setPanelTab("new")}>
                Créer un bon
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>N° bon</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Catégorie</th>
                  <th className={thClass}>Chantier</th>
                  <th className={thClass}>Véhicule</th>
                  <th className={thClass}>Litres</th>
                  <th className={thClass}>Cpt. pompe</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={`${tdClass} font-mono text-xs`}>{r.number}</td>
                    <td className={tdClass}>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${BON_TYPE_BADGE[r.bonType]}`}
                      >
                        {r.bonType === "achat" ? "Achat" : "Sortie"}
                      </span>
                    </td>
                    <td className={tdClass}>{GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory]}</td>
                    <td className={tdClass}>{projectName(r.projectId)}</td>
                    <td className={tdClass}>{r.equipmentName || r.vehicleLabel || "—"}</td>
                    <td className={tdClass}>{r.litres.toLocaleString("fr-MA")} L</td>
                    <td className={tdClass}>
                      {r.pumpMeter != null ? r.pumpMeter.toLocaleString("fr-MA") : "—"}
                    </td>
                    <td className={tdClass}>{r.bonDate}</td>
                    <td className={tdClass}>
                      <button type="button" className={btnDanger} onClick={() => void remove(r)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {panelTab === "new" ? (
        <AdminFormCard
          title="Nouveau bon gasoil"
          hint="Bon d'achat (entrée stock) ou bon de sortie (distribution). Quatre catégories : engin, camion, voiture, groupe électrogène."
          footer={
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnSecondary} onClick={() => setPanelTab("list")}>
                Annuler
              </button>
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitBon()}>
                {saving ? "Enregistrement…" : "Enregistrer le bon"}
              </button>
            </div>
          }
        >
          <div className="grid max-w-2xl gap-4">
            <div>
              <p className={labelClass}>Type de bon *</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GASOIL_BON_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={
                      bonType === t
                        ? btnPrimary
                        : `${btnSecondary} border border-border`
                    }
                    onClick={() => setBonType(t)}
                  >
                    {GASOIL_BON_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={labelClass}>Catégorie *</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GASOIL_VEHICLE_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={
                      vehicleCategory === c
                        ? `${btnPrimary} min-h-[44px] text-xs`
                        : `${btnSecondary} min-h-[44px] border border-border text-xs`
                    }
                    onClick={() => setVehicleCategory(c)}
                  >
                    {GASOIL_VEHICLE_CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={labelClass}>N° bon</p>
              <p className="mt-1 text-sm text-[var(--graphite)]/75">
                Généré à l&apos;enregistrement (ex. BON-GASOIL-SORTIE-2026-001)
              </p>
            </div>

            <div>
              <p className={labelClass}>Chantier *</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
              </div>
            </div>

            {vehicleCategory === "engin" ? (
              <div>
                <p className={labelClass}>Engin</p>
                <div className="mt-1">
                  <EquipmentSelect equipment={equipment} value={equipmentId} onChange={setEquipmentId} />
                </div>
              </div>
            ) : null}

            <div>
              <p className={labelClass}>
                {vehicleCategory === "engin" ? "Identification (si hors parc)" : "Identification véhicule *"}
              </p>
              <input
                className={`${inputClass} mt-1`}
                placeholder={
                  vehicleCategory === "camion"
                    ? "Immat. camion"
                    : vehicleCategory === "voiture"
                      ? "Immat. voiture"
                      : vehicleCategory === "groupe_electrogene"
                        ? "N° groupe / localisation"
                        : "Complément"
                }
                value={vehicleLabel}
                onChange={(e) => setVehicleLabel(e.target.value)}
              />
            </div>

            <div className={formGridClass}>
              <div>
                <p className={labelClass}>Qté (L) *</p>
                <input
                  type="number"
                  className={`${inputClass} mt-1`}
                  value={litres}
                  onChange={(e) => setLitres(e.target.value === "" ? "" : Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <p className={labelClass}>Compteur pompe</p>
                <input
                  type="number"
                  className={`${inputClass} mt-1`}
                  value={pumpMeter}
                  onChange={(e) => setPumpMeter(e.target.value)}
                />
              </div>
              <div>
                <p className={labelClass}>Date *</p>
                <input
                  type="date"
                  className={`${inputClass} mt-1`}
                  value={bonDate}
                  onChange={(e) => setBonDate(e.target.value)}
                />
              </div>
            </div>

            {bonType === "achat" ? (
              <div>
                <p className={labelClass}>Fournisseur</p>
                <input
                  className={`${inputClass} mt-1`}
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <p className={labelClass}>Bénéficiaire</p>
                <input
                  className={`${inputClass} mt-1`}
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                />
              </div>
            )}

            <DeliveryNoteSelect value={deliveryNote} onChange={setDeliveryNote} />

            <div>
              <p className={labelClass}>Notes</p>
              <input className={`${inputClass} mt-1`} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--graphite)]/85">
              <input
                type="checkbox"
                checked={syncStock}
                onChange={(e) => setSyncStock(e.target.checked)}
              />
              Mettre à jour le stock gasoil (entrée pour achat, sortie pour bon de sortie)
            </label>
          </div>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
