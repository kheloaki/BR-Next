"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { FuelJournalPanel } from "@/components/admin/FuelJournalPanel";
import { StockStatusBadge } from "@/components/admin/StatusBadge";
import type { StockItem, StockMovement } from "@/components/admin/operations-types";
import { STOCK_MOVEMENT_LABELS } from "@/components/admin/operations-types";
import {
  btnPrimary,
  btnSecondary,
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
import { gasoilMovementDetail, gasoilMovementOrigin } from "@/lib/admin/gasoil-stock-movement-label";

export type FuelStockTab = "stock" | "journal";

export function FuelGasoilStockPanel({
  onUpdated,
  initialTab = "stock",
}: {
  onUpdated?: () => void;
  initialTab?: FuelStockTab;
}) {
  const toast = useAdminToast();
  const [tab, setTab] = useState<FuelStockTab>(initialTab);
  const [item, setItem] = useState<StockItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minQty, setMinQty] = useState(0);

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
    setTab(initialTab);
  }, [initialTab]);

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

  async function saveSettings() {
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

  if (loading) return <AdminLoading />;

  const tabs = (
    <AdminTabs
      tabs={[
        { id: "stock", label: "Stock & mouvements" },
        { id: "journal", label: "Journal consommation" },
      ]}
      active={tab}
      onChange={(id) => setTab(id as FuelStockTab)}
    />
  );

  if (!item) {
    return (
      <div className="space-y-4">
        {tabs}
        {tab === "journal" ? <FuelJournalPanel gasoilStockQty={null} /> : null}
        {tab === "stock" ? (
          <div className="rounded-md border border-border bg-white px-5 py-12 text-center">
            <p className="text-sm text-[var(--graphite)]/80">
              Aucun stock gasoil configuré. Initialisez-le ici — il n&apos;apparaît pas dans Gestion de stock.
            </p>
            <button type="button" className={`mt-4 ${btnPrimary}`} disabled={saving} onClick={() => void ensureStock()}>
              {saving ? "Création…" : "Créer le stock gasoil"}
            </button>
          </div>
        ) : null}
        <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tabs}

      {tab === "journal" ? <FuelJournalPanel gasoilStockQty={item.qty} /> : null}

      {tab === "stock" ? (
        <>
      <AdminMiniStats
        items={[
          { label: "Stock ins", value: `${item.qty.toLocaleString("fr-MA")} L` },
          { label: "Seuil alerte", value: `${item.minQty.toLocaleString("fr-MA")} L` },
          {
            label: "Prix unitaire",
            value:
              item.unitPrice > 0
                ? `${item.unitPrice.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD/L`
                : "—",
          },
          { label: "Statut", value: item.status === "ok" ? "OK" : item.status === "low" ? "Bas" : "Rupture" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm text-[var(--navy)]">{item.reference || "GASOIL"}</span>
        <span className="text-sm text-[var(--graphite)]/75">— {item.designation}</span>
        <StockStatusBadge status={item.status} />
        <Link href="/admin/traitements-achat" className={`${btnPrimary} ml-auto text-sm`}>
          Traitement achat gasoil
        </Link>
        <Link href="/admin/fuel/bons" className={`${btnSecondary} text-sm`}>
          Bon de sortie
        </Link>
      </div>

      <p className="text-sm text-[var(--graphite)]/75">
        Les entrées et sorties de stock sont enregistrées automatiquement via les bons de commande et de sortie
        gasoil — pas de saisie manuelle de mouvement ici.
      </p>

      <AdminFormCard
        title="Seuil d'alerte"
        hint="Alerte affichée lorsque le stock passe sous ce seuil. Le prix unitaire est mis à jour via les bons de commande."
        footer={
          <button type="button" className={btnSecondary} disabled={saving} onClick={() => void saveSettings()}>
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

      <AdminInventoryCard title="Historique mouvements gasoil">
        {movements.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--graphite)]/70">
            Aucun mouvement.{" "}
            <Link href="/admin/traitements-achat" className="font-medium underline underline-offset-2">
              Traitement achat gasoil
            </Link>{" "}
            pour enregistrer une entrée stock.
          </div>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Origine</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Qté</th>
                <th className={thClass}>Chantier</th>
                <th className={thClass}>Fourn. / Bénéf.</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className={rowHover}>
                  <td className={tdClass}>{m.movementDate}</td>
                  <td className={tdClass}>{gasoilMovementOrigin(m)}</td>
                  <td className={tdClass}>{STOCK_MOVEMENT_LABELS[m.movementType]}</td>
                  <td className={tdClass}>{m.qty.toLocaleString("fr-MA")} L</td>
                  <td className={tdClass}>{m.siteName || "—"}</td>
                  <td className={tdClass}>{gasoilMovementDetail(m)}</td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
        </>
      ) : null}
    </div>
  );
}
