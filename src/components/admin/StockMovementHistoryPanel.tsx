"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeliveryNoteSelect } from "@/components/admin/DeliveryNoteSelect";
import { StockMovementOrigin } from "@/components/admin/StockMovementOrigin";
import { traitementStockHref } from "@/lib/admin/stock-traitement-link";
import { DepotSelect } from "@/components/admin/DepotSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import type { AdminDepot, AdminProject, StockItem, StockMovement, StockMovementType } from "@/components/admin/operations-types";
import { STOCK_MOVEMENT_LABELS, STOCK_UNITS } from "@/components/admin/operations-types";
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
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";

type StockMovementHistoryPanelProps = {
  movements: StockMovement[];
  items: StockItem[];
  projects: AdminProject[];
  depots: AdminDepot[];
  filterItemId: string;
  onFilterItemIdChange: (id: string) => void;
  saving: boolean;
  setSaving: (v: boolean) => void;
  onChanged: () => Promise<void>;
  toast: { success: (m: string) => void; error: (m: string) => void };
};

export function StockMovementHistoryPanel({
  movements,
  items,
  projects,
  depots,
  filterItemId,
  onFilterItemIdChange,
  saving,
  setSaving,
  onChanged,
  toast,
}: StockMovementHistoryPanelProps) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StockMovement | null>(null);
  const [movType, setMovType] = useState<StockMovementType>("entry");
  const [movDate, setMovDate] = useState("");
  const [movQty, setMovQty] = useState(0);
  const [movProjectId, setMovProjectId] = useState("");
  const [movDepotId, setMovDepotId] = useState("");
  const [movSupplier, setMovSupplier] = useState("");
  const [movBl, setMovBl] = useState("");
  const [movNotes, setMovNotes] = useState("");
  const [movUnit, setMovUnit] = useState("PIECE");
  const [movArticleCode, setMovArticleCode] = useState("");
  const [movUnitPrice, setMovUnitPrice] = useState(0);
  const [movAssignment, setMovAssignment] = useState("");
  const [movExitVoucherNo, setMovExitVoucherNo] = useState("");
  const [movRequester, setMovRequester] = useState("");
  const [movStorekeeper, setMovStorekeeper] = useState("");

  function fmtQty(n: number) {
    return n.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  const depotName = (id: string | null) => {
    if (!id) return "—";
    return depots.find((d) => d.id === id)?.name ?? "—";
  };

  const filtered = useMemo(() => {
    let rows = movements;
    if (filterItemId) rows = rows.filter((m) => m.itemId === filterItemId);
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (m) =>
        m.reference.toLowerCase().includes(q) ||
        m.designation.toLowerCase().includes(q) ||
        m.supplier.toLowerCase().includes(q) ||
        m.deliveryNote.toLowerCase().includes(q) ||
        m.assignment.toLowerCase().includes(q) ||
        m.requester.toLowerCase().includes(q) ||
        m.exitVoucherNo.toLowerCase().includes(q) ||
        (m.siteName || "").toLowerCase().includes(q),
    );
  }, [movements, filterItemId, search]);

  function openEdit(m: StockMovement) {
    setEditing(m);
    setMovType(m.movementType);
    setMovDate(m.movementDate);
    setMovQty(m.qty);
    setMovProjectId(m.projectId ?? "");
    setMovDepotId(m.depotId ?? "");
    setMovSupplier(m.supplier);
    setMovBl(m.deliveryNote);
    setMovNotes(m.notes);
    setMovUnit(m.unit || "PIECE");
    setMovArticleCode(m.articleCode);
    setMovUnitPrice(m.unitPrice);
    setMovAssignment(m.assignment);
    setMovExitVoucherNo(m.exitVoucherNo);
    setMovRequester(m.requester);
    setMovStorekeeper(m.storekeeper);
  }

  function closeEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;
    if (movQty <= 0) {
      toast.error("Indiquez une quantité valide.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/stock/movements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        movementType: movType,
        movementDate: movDate,
        qty: movQty,
        projectId: movProjectId || null,
        depotId: movDepotId || null,
        supplier: movSupplier,
        deliveryNote: movBl,
        notes: movNotes,
        unit: movUnit,
        articleCode: movArticleCode,
        unitPrice: movUnitPrice,
        assignment: movAssignment,
        exitVoucherNo: movExitVoucherNo,
        requester: movRequester,
        storekeeper: movStorekeeper,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Mouvement mis à jour.");
    closeEdit();
    await onChanged();
  }

  async function removeMovement(m: StockMovement) {
    if (
      !(await confirmDelete(`${m.reference} — ${STOCK_MOVEMENT_LABELS[m.movementType]}`, {
        title: "Supprimer le mouvement",
        description: `Retirer ce mouvement du ${m.movementDate} (${m.qty} unités) ? Le stock sera recalculé.`,
        confirmLabel: "Supprimer",
      }))
    ) {
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/stock/movements?id=${encodeURIComponent(m.id)}`, {
      method: "DELETE",
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Mouvement supprimé — stock recalculé.");
    if (editing?.id === m.id) closeEdit();
    await onChanged();
  }

  return (
    <div className="space-y-4">
      <AdminInventoryCard
        title="Historique des mouvements"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Référence, article, fournisseur, BL…"
        actions={
          <select
            className={`${inputClass} max-w-[240px] min-h-[38px] py-2`}
            value={filterItemId}
            onChange={(e) => onFilterItemIdChange(e.target.value)}
          >
            <option value="">Tous les articles</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.reference} — {i.designation}
              </option>
            ))}
          </select>
        }
      >
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
            Aucun mouvement pour ce filtre.
          </div>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Réf.</th>
                <th className={thClass}>Article</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Origine</th>
                <th className={thClass}>Qté</th>
                <th className={thClass}>Unité</th>
                <th className={`${thClass} text-right`}>Stock final</th>
                <th className={thClass}>Affectation</th>
                <th className={thClass}>N° bon sortie</th>
                <th className={thClass}>Demandeur</th>
                <th className={thClass}>Chantier</th>
                <th className={thClass}>Dépôt</th>
                <th className={thClass}>Fournisseur</th>
                <th className={thClass}>N° BL</th>
                <th className={thClass}>Notes</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className={rowHover}>
                  <td className={tdClass}>{m.movementDate}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{m.reference}</td>
                  <td className={tdClass}>{m.designation}</td>
                  <td className={tdClass}>{STOCK_MOVEMENT_LABELS[m.movementType]}</td>
                  <td className={tdClass}>
                    <StockMovementOrigin link={m.traitementLink} />
                  </td>
                  <td className={`${tdClass} tabular-nums`}>{fmtQty(m.qty)}</td>
                  <td className={tdClass}>{m.unit || "—"}</td>
                  <td
                    className={`${tdClass} text-right tabular-nums ${
                      m.movementType === "exit" && m.stockAfter < 0 ? "text-red-600 font-medium" : ""
                    }`}
                  >
                    {m.movementType === "exit" ? fmtQty(m.stockAfter) : "—"}
                  </td>
                  <td className={tdClass}>{m.assignment || "—"}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{m.exitVoucherNo || "—"}</td>
                  <td className={tdClass}>{m.requester || "—"}</td>
                  <td className={tdClass}>{m.siteName || "—"}</td>
                  <td className={tdClass}>{depotName(m.depotId)}</td>
                  <td className={tdClass}>{m.supplier || "—"}</td>
                  <td className={tdClass}>{m.deliveryNote || "—"}</td>
                  <td className={`${tdClass} max-w-[120px] truncate`} title={m.notes}>
                    {m.notes || "—"}
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      {m.traitementLink ? (
                        <Link href={traitementStockHref(m.traitementLink)} className={btnSecondary}>
                          Traitement
                        </Link>
                      ) : (
                        <>
                          <button type="button" className={btnSecondary} onClick={() => openEdit(m)}>
                            Modifier
                          </button>
                          <button type="button" className={btnDanger} onClick={() => void removeMovement(m)}>
                            Suppr.
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>

      {editing ? (
        <AdminFormCard
          title={`Modifier mouvement — ${editing.reference}`}
          hint={
            editing.traitementLink
              ? "Ce mouvement est lié à un traitement — modification impossible depuis le stock."
              : `${editing.designation} · enregistré le ${new Date(editing.createdAt).toLocaleDateString("fr-MA")}`
          }
          footer={
            editing.traitementLink ? (
              <button type="button" className={btnSecondary} onClick={closeEdit}>
                Fermer
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} onClick={closeEdit}>
                  Annuler
                </button>
                <button type="button" className={btnPrimary} disabled={saving} onClick={() => void saveEdit()}>
                  {saving ? "Enregistrement…" : "Enregistrer les modifications"}
                </button>
              </div>
            )
          }
        >
          {editing.traitementLink ? (
            <p className="text-sm text-[var(--graphite)]/80">
              Ouvrez le traitement source pour corriger un BL/BR.{" "}
              <StockMovementOrigin link={editing.traitementLink} />
            </p>
          ) : (
          <div className={`${formGridClass} max-w-3xl`}>
            <div>
              <p className={labelClass}>Type</p>
              <select
                className={`${inputClass} mt-1`}
                value={movType}
                onChange={(e) => setMovType(e.target.value as StockMovementType)}
              >
                {(Object.keys(STOCK_MOVEMENT_LABELS) as StockMovementType[]).map((k) => (
                  <option key={k} value={k}>
                    {STOCK_MOVEMENT_LABELS[k]}
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
              <p className={labelClass}>Quantité</p>
              <input
                type="number"
                min={0}
                className={`${inputClass} mt-1`}
                value={movQty || ""}
                onChange={(e) => setMovQty(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <p className={labelClass}>Unité</p>
              <select className={`${inputClass} mt-1`} value={movUnit} onChange={(e) => setMovUnit(e.target.value)}>
                {STOCK_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>Code article</p>
              <input
                className={`${inputClass} mt-1`}
                value={movArticleCode}
                onChange={(e) => setMovArticleCode(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>Prix unitaire HT</p>
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${inputClass} mt-1`}
                value={movUnitPrice || ""}
                onChange={(e) => setMovUnitPrice(Number(e.target.value) || 0)}
              />
            </div>
            {movType === "exit" ? (
              <>
                <div>
                  <p className={labelClass}>Affectation</p>
                  <input
                    className={`${inputClass} mt-1`}
                    value={movAssignment}
                    onChange={(e) => setMovAssignment(e.target.value)}
                  />
                </div>
                <div>
                  <p className={labelClass}>N° bon sortie</p>
                  <input
                    className={`${inputClass} mt-1`}
                    value={movExitVoucherNo}
                    onChange={(e) => setMovExitVoucherNo(e.target.value)}
                  />
                </div>
                <div>
                  <p className={labelClass}>Demandeur</p>
                  <input
                    className={`${inputClass} mt-1`}
                    value={movRequester}
                    onChange={(e) => setMovRequester(e.target.value)}
                  />
                </div>
                <div>
                  <p className={labelClass}>Magasinier</p>
                  <input
                    className={`${inputClass} mt-1`}
                    value={movStorekeeper}
                    onChange={(e) => setMovStorekeeper(e.target.value)}
                  />
                </div>
              </>
            ) : null}
            <div>
              <p className={labelClass}>Chantier</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={movProjectId} onChange={setMovProjectId} allowEmpty />
              </div>
            </div>
            <div>
              <p className={labelClass}>Dépôt</p>
              <div className="mt-1">
                <DepotSelect depots={depots} value={movDepotId} onChange={setMovDepotId} placeholder="Dépôt" />
              </div>
            </div>
            <div>
              <p className={labelClass}>Fournisseur</p>
              <input
                className={`${inputClass} mt-1`}
                value={movSupplier}
                onChange={(e) => setMovSupplier(e.target.value)}
              />
            </div>
            <DeliveryNoteSelect value={movBl} onChange={setMovBl} label="N° bon de livraison" className="sm:col-span-2" />
            <div className="sm:col-span-2">
              <p className={labelClass}>Notes</p>
              <textarea
                className={`${inputClass} mt-1`}
                rows={2}
                value={movNotes}
                onChange={(e) => setMovNotes(e.target.value)}
              />
            </div>
          </div>
          )}
        </AdminFormCard>
      ) : null}
    </div>
  );
}
