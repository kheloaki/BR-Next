"use client";

import { useCallback, useEffect, useState } from "react";
import { DeliveryNoteSelect } from "@/components/admin/DeliveryNoteSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { StockStatusBadge } from "@/components/admin/StatusBadge";
import type { AdminProject, StockItem, StockMovement, StockMovementType } from "@/components/admin/operations-types";
import { STOCK_MOVEMENT_LABELS } from "@/components/admin/operations-types";
import {
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
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function FuelGasoilStockPanel({
  projects,
  onUpdated,
}: {
  projects: AdminProject[];
  onUpdated?: () => void;
}) {
  const toast = useAdminToast();
  const [item, setItem] = useState<StockItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [minQty, setMinQty] = useState(0);
  const [movType, setMovType] = useState<StockMovementType>("entry");
  const [movQty, setMovQty] = useState<number | "">("");
  const [movDate, setMovDate] = useState(new Date().toISOString().slice(0, 10));
  const [movProjectId, setMovProjectId] = useState("");
  const [movSupplier, setMovSupplier] = useState("");
  const [movBl, setMovBl] = useState("");
  const [movNotes, setMovNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const stockRes = await fetch("/api/admin/fuel/stock", { cache: "no-store" });
    if (stockRes.ok) {
      const { item: stockItem } = (await stockRes.json()) as { item: StockItem | null };
      setItem(stockItem);
      setMinQty(stockItem?.minQty ?? 0);
      if (stockItem?.id) {
        const movRes = await fetch(
          `/api/admin/stock/movements?itemId=${encodeURIComponent(stockItem.id)}`,
          { cache: "no-store" },
        );
        if (movRes.ok) setMovements((await movRes.json()) as StockMovement[]);
      } else {
        setMovements([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function ensureStock() {
    setSaving(true);
    const res = await fetch("/api/admin/fuel/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ensure" }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const { item: created } = (await res.json()) as { item: StockItem };
    setItem(created);
    setMinQty(created.minQty);
    toast.success("Stock gasoil initialisé.");
    await load();
    onUpdated?.();
  }

  async function saveThreshold() {
    if (!item) return;
    setSaving(true);
    const res = await fetch("/api/admin/fuel/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", minQty }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Seuil d'alerte enregistré.");
    await load();
    onUpdated?.();
  }

  async function submitMovement() {
    if (!item) {
      toast.error("Initialisez d'abord le stock gasoil.");
      return;
    }
    const litres = typeof movQty === "number" ? movQty : Number(movQty);
    if (!litres || litres <= 0) {
      toast.error("Indiquez une quantité en litres.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/fuel/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "movement",
        movementType: movType,
        qty: litres,
        movementDate: movDate,
        projectId: movProjectId || undefined,
        supplier: movSupplier,
        deliveryNote: movBl,
        notes: movNotes,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Mouvement enregistré.");
    setMovQty("");
    setMovBl("");
    setMovNotes("");
    await load();
    onUpdated?.();
  }

  if (loading) return <AdminLoading />;

  if (!item) {
    return (
      <div className="rounded-md border border-border bg-white px-5 py-12 text-center">
        <p className="text-sm text-[var(--graphite)]/80">
          Aucun stock gasoil configuré. Initialisez-le ici — il n&apos;apparaît pas dans Gestion de stock.
        </p>
        <button type="button" className={`mt-4 ${btnPrimary}`} disabled={saving} onClick={() => void ensureStock()}>
          {saving ? "Création…" : "Créer le stock gasoil"}
        </button>
        <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminMiniStats
        items={[
          { label: "Stock ins", value: `${item.qty.toLocaleString("fr-MA")} L` },
          { label: "Seuil alerte", value: `${item.minQty.toLocaleString("fr-MA")} L` },
          { label: "Statut", value: item.status === "ok" ? "OK" : item.status === "low" ? "Bas" : "Rupture" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm text-[var(--navy)]">{item.reference || "GASOIL"}</span>
        <span className="text-sm text-[var(--graphite)]/75">— {item.designation}</span>
        <StockStatusBadge status={item.status} />
      </div>

      <AdminFormCard
        title="Seuil d'alerte"
        hint="Alerte affichée lorsque le stock passe sous ce seuil."
        footer={
          <button type="button" className={btnSecondary} disabled={saving} onClick={() => void saveThreshold()}>
            Enregistrer le seuil
          </button>
        }
      >
        <div className="max-w-xs">
          <p className={labelClass}>Stock minimum (L)</p>
          <input
            type="number"
            className={`${inputClass} mt-1`}
            value={minQty}
            onChange={(e) => setMinQty(Number(e.target.value) || 0)}
          />
        </div>
      </AdminFormCard>

      <AdminFormCard
        title="Mouvement stock"
        footer={
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitMovement()}>
            {saving ? "Enregistrement…" : "Enregistrer le mouvement"}
          </button>
        }
      >
        <div className={`${formGridClass} max-w-2xl`}>
          <div>
            <p className={labelClass}>Type</p>
            <select
              className={`${inputClass} mt-1`}
              value={movType}
              onChange={(e) => setMovType(e.target.value as StockMovementType)}
            >
              {(Object.keys(STOCK_MOVEMENT_LABELS) as StockMovementType[]).map((t) => (
                <option key={t} value={t}>
                  {STOCK_MOVEMENT_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className={labelClass}>Date</p>
            <input
              type="date"
              className={`${inputClass} mt-1`}
              value={movDate}
              onChange={(e) => setMovDate(e.target.value)}
            />
          </div>
          <div>
            <p className={labelClass}>Quantité (L) *</p>
            <input
              type="number"
              className={`${inputClass} mt-1`}
              value={movQty}
              onChange={(e) => setMovQty(e.target.value === "" ? "" : Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <p className={labelClass}>Chantier</p>
            <div className="mt-1">
              <ProjectSelect projects={projects} value={movProjectId} onChange={setMovProjectId} allowEmpty />
            </div>
          </div>
          <input
            className={inputClass}
            placeholder="Fournisseur"
            value={movSupplier}
            onChange={(e) => setMovSupplier(e.target.value)}
          />
          <DeliveryNoteSelect
            value={movBl}
            onChange={setMovBl}
            label="N° BL / bon livraison"
            className="sm:col-span-2"
          />
          <input
            className={`${inputClass} md:col-span-2`}
            placeholder="Notes"
            value={movNotes}
            onChange={(e) => setMovNotes(e.target.value)}
          />
        </div>
      </AdminFormCard>

      <AdminInventoryCard title="Historique mouvements gasoil">
        {movements.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--graphite)]/70">Aucun mouvement.</div>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Qté</th>
                <th className={thClass}>Chantier</th>
                <th className={thClass}>BL</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className={rowHover}>
                  <td className={tdClass}>{m.movementDate}</td>
                  <td className={tdClass}>{STOCK_MOVEMENT_LABELS[m.movementType]}</td>
                  <td className={tdClass}>{m.qty.toLocaleString("fr-MA")} L</td>
                  <td className={tdClass}>{m.siteName || "—"}</td>
                  <td className={tdClass}>{m.deliveryNote || "—"}</td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
