"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_GASOIL_BON_FORM,
  FuelGasoilBonForm,
  gasoilBonNotesFromForm,
  gasoilBonRowToForm,
  validateGasoilBonForm,
  type GasoilBonFormState,
} from "@/components/admin/FuelGasoilBonForm";
import type {
  AdminProject,
  GasoilBon,
  GasoilBonType,
  GasoilContact,
  GasoilVehicleCategory,
  RentalMaterial,
  StockItem,
} from "@/components/admin/operations-types";
import type { Supplier } from "@/components/admin/devis-types";
import type { GasoilUnitPriceInfo } from "@/lib/admin/gasoil-unit-price";
import {
  GASOIL_VEHICLE_CATEGORIES,
  GASOIL_VEHICLE_CATEGORY_LABELS,
} from "@/lib/admin/gasoil-bon";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputClass,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

type PanelTab = "list" | "form";

export function FuelGasoilBonPanel({
  projects,
  materials,
  projectIdFromUrl,
  onStockUpdated,
  fixedBonType,
}: {
  projects: AdminProject[];
  materials: RentalMaterial[];
  projectIdFromUrl?: string;
  onStockUpdated?: () => void;
  fixedBonType: GasoilBonType;
}) {
  const isCommande = fixedBonType === "achat";
  const listTitle = isCommande ? "Bons de commande gasoil" : "Bons de sortie gasoil";
  const newLabel = isCommande ? "Nouveau bon de commande" : "Nouveau bon de sortie";
  const saveLabel = isCommande ? "Enregistrer la commande" : "Enregistrer le bon";
  const toast = useAdminToast();
  const [panelTab, setPanelTab] = useState<PanelTab>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rows, setRows] = useState<GasoilBon[]>([]);
  const [gasoilStock, setGasoilStock] = useState<StockItem | null>(null);
  const [avgUnitPriceInfo, setAvgUnitPriceInfo] = useState<GasoilUnitPriceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [form, setForm] = useState<GasoilBonFormState>({
    ...EMPTY_GASOIL_BON_FORM,
    bonType: fixedBonType,
  });
  const [gasoilContacts, setGasoilContacts] = useState<GasoilContact[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("bonType", fixedBonType);
    if (!isCommande && filterCategory) params.set("vehicleCategory", filterCategory);
    const qs = params.toString();
    const supplierFetch = isCommande
      ? fetch("/api/admin/suppliers?supplyType=gasoil", { cache: "no-store" })
      : Promise.resolve(null);
    const [bonRes, stockRes, contactsRes, suppliersRes] = await Promise.all([
      fetch(`/api/admin/fuel/bons${qs ? `?${qs}` : ""}`, { cache: "no-store" }),
      fetch("/api/admin/fuel/stock", { cache: "no-store" }),
      fetch("/api/admin/gasoil-contacts", { cache: "no-store" }),
      supplierFetch,
    ]);
    if (bonRes.ok) setRows((await bonRes.json()) as GasoilBon[]);
    if (stockRes.ok) {
      const data = (await stockRes.json()) as {
        item: StockItem | null;
        unitPriceInfo?: GasoilUnitPriceInfo;
      };
      setGasoilStock(data.item);
      setAvgUnitPriceInfo(data.unitPriceInfo ?? null);
    }
    if (contactsRes.ok) setGasoilContacts((await contactsRes.json()) as GasoilContact[]);
    if (suppliersRes?.ok) setSuppliers((await suppliersRes.json()) as Supplier[]);
    setLoading(false);
  }, [fixedBonType, filterCategory, isCommande]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (projectIdFromUrl) setForm((f) => ({ ...f, projectId: projectIdFromUrl }));
  }, [projectIdFromUrl]);

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
        r.beneficiary.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q) ||
        GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory].toLowerCase().includes(q),
    );
  }, [rows, search, projects]);

  const fetchNextBonNumber = useCallback(async () => {
    const params = new URLSearchParams({ next: "1", bonType: fixedBonType });
    const res = await fetch(`/api/admin/fuel/bons?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return "";
    const data = (await res.json()) as { number?: string };
    return data.number ?? "";
  }, [fixedBonType]);

  async function resetForm() {
    const bonNumber = await fetchNextBonNumber();
    const avgPrice = avgUnitPriceInfo?.unitPricePerLitre ?? 0;
    const stockPrice = gasoilStock?.unitPrice ?? 0;
    const defaultPrice = isCommande ? stockPrice : avgPrice > 0 ? avgPrice : stockPrice;
    setEditingId(null);
    setForm({
      ...EMPTY_GASOIL_BON_FORM,
      bonType: fixedBonType,
      projectId: projectIdFromUrl ?? "",
      bonNumber,
      unitPricePerLitre: defaultPrice > 0 ? defaultPrice : "",
    });
  }

  async function openNew() {
    await resetForm();
    setPanelTab("form");
  }

  function openEdit(row: GasoilBon) {
    if (row.traitementId) {
      toast.error("Ce bon est lié à un traitement. Modifiez-le depuis Traitements.");
      return;
    }
    setEditingId(row.id);
    setForm(gasoilBonRowToForm(row));
    setPanelTab("form");
  }

  async function submitBon() {
    const err = validateGasoilBonForm(form);
    if (err) {
      toast.error(err);
      return;
    }

    const L = typeof form.litres === "number" ? form.litres : Number(form.litres);

    setSaving(true);
    const payload = {
      number: form.bonNumber || undefined,
      bonType: fixedBonType,
      vehicleCategory: isCommande ? "engin" : form.vehicleCategory,
      projectId: form.projectId,
      materialId: isCommande ? undefined : form.materialId || undefined,
      vehicleLabel: isCommande ? "" : form.vehicleLabel,
      bonDate: form.bonDate,
      litres: L,
      pumpMeter: form.pumpMeter.trim() ? Number(form.pumpMeter) : null,
      supplier: isCommande ? form.supplier : form.pumpAttendant,
      beneficiary: isCommande ? "" : form.driverName,
      driverContactId: isCommande ? undefined : form.driverContactId || undefined,
      pompisteContactId: isCommande ? undefined : form.pompisteContactId || undefined,
      fuelTime: isCommande ? "" : form.fuelTime,
      deliveryNote: "",
      notes: gasoilBonNotesFromForm(form),
      syncStock: form.syncStock,
      unitPricePerLitre:
        typeof form.unitPricePerLitre === "number" && form.unitPricePerLitre > 0
          ? form.unitPricePerLitre
          : undefined,
    };

    const res = await fetch("/api/admin/fuel/bons", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const saved = (await res.json()) as GasoilBon;
    toast.success(
      editingId
        ? `${isCommande ? "Bon de commande" : "Bon de sortie"} N° ${saved.number} mis à jour.`
        : `${isCommande ? "Bon de commande" : "Bon de sortie"} — N° ${saved.number}`,
    );
    await resetForm();
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

  function exportBon(row: GasoilBon, format: "pdf" | "excel") {
    const url = `/api/admin/fuel/bons/export?id=${encodeURIComponent(row.id)}&format=${format}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (loading) return <AdminLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-[var(--background)] px-3 py-2 text-sm">
        <span className="text-[var(--graphite)]/70">Stock gasoil :</span>
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
        <button type="button" className={panelTab === "form" ? btnPrimary : btnSecondary} onClick={openNew}>
          {newLabel}
        </button>
      </div>

      {panelTab === "list" ? (
        <AdminInventoryCard
          title={listTitle}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={isCommande ? "N° document, chantier, fournisseur…" : "N° bon, chantier, véhicule…"}
          actions={
            <button type="button" className={btnPrimary} onClick={openNew}>
              {isCommande ? "Nouvelle commande" : "Nouveau bon"}
            </button>
          }
        >
          {!isCommande ? (
            <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
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
          ) : null}

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {isCommande ? "Aucun bon de commande gasoil." : "Aucun bon de sortie gasoil."}
              <button type="button" className={`mt-4 block mx-auto ${btnPrimary}`} onClick={openNew}>
                {isCommande ? "Créer une commande" : "Créer un bon"}
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>{isCommande ? "N° document" : "N° bon"}</th>
                  {!isCommande ? <th className={thClass}>Catégorie</th> : null}
                  <th className={thClass}>Chantier</th>
                  {!isCommande ? <th className={thClass}>Véhicule</th> : null}
                  <th className={thClass}>Litres</th>
                  {!isCommande ? <th className={thClass}>Prix/L</th> : null}
                  <th className={thClass}>Compteur</th>
                  <th className={thClass}>{isCommande ? "Fournisseur" : "Conducteur"}</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={`${tdClass} font-mono text-xs`}>{r.number}</td>
                    {!isCommande ? (
                      <td className={tdClass}>{GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory]}</td>
                    ) : null}
                    <td className={tdClass}>{projectName(r.projectId)}</td>
                    {!isCommande ? (
                      <td className={tdClass}>{r.equipmentName || r.vehicleLabel || "—"}</td>
                    ) : null}
                    <td className={tdClass}>{r.litres.toLocaleString("fr-MA")} L</td>
                    {!isCommande ? (
                      <td className={`${tdClass} tabular-nums`}>
                        {r.unitPrice && r.unitPrice > 0
                          ? `${r.unitPrice.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`
                          : "—"}
                      </td>
                    ) : null}
                    <td className={tdClass}>
                      {r.pumpMeter != null ? r.pumpMeter.toLocaleString("fr-MA") : "—"}
                    </td>
                    <td className={tdClass}>{isCommande ? r.supplier || "—" : r.beneficiary || "—"}</td>
                    <td className={tdClass}>{r.bonDate}</td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={`${btnSecondary} px-2 py-1 text-[10px]`}
                          onClick={() => openEdit(r)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className={`${btnSecondary} px-2 py-1 text-[10px]`}
                          onClick={() => exportBon(r, "pdf")}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          className={`${btnSecondary} px-2 py-1 text-[10px]`}
                          onClick={() => exportBon(r, "excel")}
                        >
                          Excel
                        </button>
                        <button type="button" className={btnDanger} onClick={() => void remove(r)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {panelTab === "form" ? (
        <div className="space-y-4">
          <FuelGasoilBonForm
            form={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            projects={projects}
            materials={materials}
            gasoilContacts={gasoilContacts}
            fixedBonType={fixedBonType}
            lockBonNumber={!!editingId}
            avgUnitPriceInfo={avgUnitPriceInfo}
            suppliers={suppliers}
            onSupplierAdded={(supplier) =>
              setSuppliers((prev) => (prev.some((s) => s.id === supplier.id) ? prev : [...prev, supplier]))
            }
            onGasoilContactAdded={(contact) =>
              setGasoilContacts((prev) =>
                prev.some((c) => c.id === contact.id) ? prev : [...prev, contact],
              )
            }
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                setEditingId(null);
                setPanelTab("list");
              }}
            >
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitBon()}>
              {saving
                ? "Enregistrement…"
                : editingId
                  ? isCommande
                    ? "Enregistrer les modifications"
                    : "Enregistrer le bon"
                  : saveLabel}
            </button>
          </div>
        </div>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
