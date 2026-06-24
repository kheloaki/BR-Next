"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DepotSelect } from "@/components/admin/DepotSelect";
import { StockItemSelect } from "@/components/admin/StockItemSelect";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { idNameOptions, withEmptyOption } from "@/components/admin/searchable-options";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { StockItem } from "@/components/admin/operations-types";
import { STOCK_MOVEMENT_LABELS } from "@/components/admin/operations-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  rowHover,
  tdClass,
  tdTextClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { StockDepotPanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

type DepotBalanceRow = {
  id: string;
  depotId: string;
  depotName: string;
  stockItemId: string;
  reference: string;
  designation: string;
  unit: string;
  qty: number;
};

export function StockDepotPanel({
  items,
  onChanged,
}: {
  items: StockItem[];
  onChanged: () => void | Promise<void>;
}) {
  const toast = useAdminToast();
  const { depots } = useOpsReferential();
  const [balances, setBalances] = useState<DepotBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterDepotId, setFilterDepotId] = useState("");

  const [mode, setMode] = useState<"entry" | "exit" | "transfer">("entry");
  const [itemId, setItemId] = useState("");
  const [depotId, setDepotId] = useState("");
  const [destDepotId, setDestDepotId] = useState("");
  const [qty, setQty] = useState(1);
  const [movementDate, setMovementDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const loadBalances = useCallback(async () => {
    setLoading(true);
    const qs = filterDepotId ? `?depotId=${encodeURIComponent(filterDepotId)}` : "";
    const res = await fetch(`/api/admin/stock/depot-balances${qs}`, { cache: "no-store" });
    if (res.ok) setBalances((await res.json()) as DepotBalanceRow[]);
    setLoading(false);
  }, [filterDepotId]);

  useEffect(() => {
    void loadBalances();
  }, [loadBalances]);

  const itemOptions = useMemo(
    () => items.filter((i) => i.productId).sort((a, b) => a.designation.localeCompare(b.designation)),
    [items],
  );

  const { sort, onSort, applySort } = useTableSort("depot", "asc");

  const balanceSortAccessors = useMemo(
    () => ({
      depot: (b: DepotBalanceRow) => b.depotName,
      reference: (b: DepotBalanceRow) => b.reference,
      article: (b: DepotBalanceRow) => b.designation,
      qty: (b: DepotBalanceRow) => b.qty,
    }),
    [],
  );

  const sortedBalances = useMemo(
    () => applySort(balances, balanceSortAccessors),
    [balances, applySort, balanceSortAccessors],
  );

  async function submitMovement() {
    if (!itemId || !depotId || qty <= 0) {
      toast.error("Article, dépôt et quantité requis.");
      return;
    }
    if (mode === "transfer" && !destDepotId) {
      toast.error("Sélectionnez le dépôt destination.");
      return;
    }
    if (mode === "transfer" && depotId === destDepotId) {
      toast.error("Les dépôts doivent être différents.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/stock/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        movementType: mode === "transfer" ? "transfer" : mode,
        qty,
        movementDate,
        depotId,
        destinationDepotId: mode === "transfer" ? destDepotId : undefined,
        notes: notes.trim() || undefined,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }

    toast.success(
      mode === "transfer"
        ? "Transfert enregistré."
        : mode === "entry"
          ? "Entrée dépôt enregistrée."
          : "Sortie dépôt enregistrée.",
    );
    setQty(1);
    setNotes("");
    await loadBalances();
    await onChanged();
  }

  return (
    <div className="space-y-4">
      <AdminFormCard title="Mouvement dépôt">
        <div className="mb-3 flex flex-wrap gap-2">
          {(["entry", "exit", "transfer"] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={mode === m ? btnPrimary : btnSecondary}
              onClick={() => setMode(m)}
            >
              {m === "entry" ? "Entrée" : m === "exit" ? "Sortie" : "Transfert"}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className={labelClass}>Article *</p>
            <StockItemSelect
              items={itemOptions}
              value={itemId}
              onChange={setItemId}
              placeholder="— Produit / stock —"
              inputClassName={`${inputClass} mt-1`}
            />
          </div>
          <div>
            <p className={labelClass}>{mode === "transfer" ? "Dépôt source *" : "Dépôt *"}</p>
            <div className="mt-1">
              <DepotSelect depots={depots} value={depotId} onChange={setDepotId} allowEmpty={false} />
            </div>
          </div>
          {mode === "transfer" ? (
            <div>
              <p className={labelClass}>Dépôt destination *</p>
              <div className="mt-1">
                <DepotSelect depots={depots} value={destDepotId} onChange={setDestDepotId} allowEmpty={false} />
              </div>
            </div>
          ) : null}
          <div>
            <p className={labelClass}>Quantité *</p>
            <input
              type="number"
              min={0}
              step={0.01}
              className={`${inputClass} mt-1`}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <p className={labelClass}>Date</p>
            <input
              type="date"
              className={`${inputClass} mt-1`}
              value={movementDate}
              onChange={(e) => setMovementDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <p className={labelClass}>Notes</p>
            <input className={`${inputClass} mt-1`} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitMovement()}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <Link href="/admin/depots" className={btnSecondary}>
            Gérer les dépôts
          </Link>
          <Link href="/admin/products" className={btnSecondary}>
            Catalogue produits
          </Link>
        </div>
      </AdminFormCard>

      <AdminInventoryCard
        title="Stock par dépôt"
        actions={
          <SearchableSelect
            options={withEmptyOption(idNameOptions(depots), "Tous les dépôts")}
            value={filterDepotId}
            onChange={setFilterDepotId}
            placeholder="Tous les dépôts"
            inputClassName={`${inputClass} max-w-[200px]`}
          />
        }
      >
        {loading ? (
          <StockDepotPanelSkeleton />
        ) : balances.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-[var(--graphite)]/70">
            Aucun stock en dépôt. Enregistrez une entrée ou un BL achat avec dépôt sélectionné.
          </p>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <AdminSortableTh label="Dépôt" sortKey="depot" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Réf." sortKey="reference" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Article" sortKey="article" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Qté" sortKey="qty" sort={sort} onSort={onSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {sortedBalances.map((b) => (
                <tr key={b.id} className={rowHover}>
                  <td className={tdClass}>
                    <AdminTruncatedText text={b.depotName} lines={1} />
                  </td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={b.reference} lines={1} />
                  </td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={b.designation} />
                  </td>
                  <td className={tdClass}>
                    {b.qty.toLocaleString("fr-MA")} {b.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>

      <p className="text-xs text-[var(--graphite)]/65">
        Les traitements achat/vente (BL/BR) utilisent le dépôt sélectionné sur le traitement. Le gasoil n&apos;est
        pas géré par dépôt ici — voir{" "}
        <Link href="/admin/fuel/stock" className="font-medium underline underline-offset-2">
          Carburant → Stock gasoil
        </Link>
        . Les transferts déplacent
        le stock entre dépôts sans changer le total global ({STOCK_MOVEMENT_LABELS.transfer.toLowerCase()}).
      </p>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
