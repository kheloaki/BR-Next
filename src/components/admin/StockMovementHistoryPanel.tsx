"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeliveryNoteSelect } from "@/components/admin/DeliveryNoteSelect";
import { StockMovementOrigin } from "@/components/admin/StockMovementOrigin";
import { traitementStockHref } from "@/lib/admin/stock-traitement-link";
import { DepotSelect } from "@/components/admin/DepotSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { stringOptions, withEmptyOption } from "@/components/admin/searchable-options";
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
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { useTableSort } from "@/components/admin/ux/useTableSort";
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

  const { sort, onSort, applySort } = useTableSort("date", "desc");

  const movementSortAccessors = useMemo(
    () => ({
      date: (m: StockMovement) => m.movementDate,
      reference: (m: StockMovement) => m.reference,
      article: (m: StockMovement) => m.designation,
      type: (m: StockMovement) => STOCK_MOVEMENT_LABELS[m.movementType],
      origin: (m: StockMovement) => m.traitementLink?.docNumber ?? "",
      qty: (m: StockMovement) => m.qty,
      unit: (m: StockMovement) => m.unit,
      stockAfter: (m: StockMovement) => m.stockAfter,
      assignment: (m: StockMovement) => m.assignment,
      exitVoucherNo: (m: StockMovement) => m.exitVoucherNo,
      requester: (m: StockMovement) => m.requester,
      site: (m: StockMovement) => m.siteName,
      depot: (m: StockMovement) => depotName(m.depotId),
      supplier: (m: StockMovement) => m.supplier,
      deliveryNote: (m: StockMovement) => m.deliveryNote,
      notes: (m: StockMovement) => m.notes,
    }),
    [depots],
  );

  const sortedFiltered = useMemo(
    () => applySort(filtered, movementSortAccessors),
    [filtered, applySort, movementSortAccessors],
  );

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
          <SearchableSelect
            options={withEmptyOption(
              items.map((i) => ({
                value: i.id,
                label: `${i.reference} — ${i.designation}`,
                keywords: `${i.reference} ${i.designation}`,
              })),
              "Tous les articles",
            )}
            value={filterItemId}
            onChange={onFilterItemIdChange}
            placeholder="Tous les articles"
            inputClassName={`${inputClass} max-w-[240px] min-h-[38px] py-2`}
          />
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
                <AdminSortableTh label="Date" sortKey="date" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Réf." sortKey="reference" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Article" sortKey="article" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Type" sortKey="type" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Origine" sortKey="origin" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Qté" sortKey="qty" sort={sort} onSort={onSort} align="right" />
                <AdminSortableTh label="Unité" sortKey="unit" sort={sort} onSort={onSort} />
                <AdminSortableTh
                  label="Stock final"
                  sortKey="stockAfter"
                  sort={sort}
                  onSort={onSort}
                  className={`${thClass} text-right`}
                  align="right"
                />
                <AdminSortableTh label="Affectation" sortKey="assignment" sort={sort} onSort={onSort} />
                <AdminSortableTh label="N° bon sortie" sortKey="exitVoucherNo" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Demandeur" sortKey="requester" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Chantier" sortKey="site" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Dépôt" sortKey="depot" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Fournisseur" sortKey="supplier" sort={sort} onSort={onSort} />
                <AdminSortableTh label="N° BL" sortKey="deliveryNote" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Notes" sortKey="notes" sort={sort} onSort={onSort} />
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map((m) => (
                <tr key={m.id} className={rowHover}>
                  <td className={tdClass}>{m.movementDate}</td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={m.reference} lines={1} />
                  </td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={m.designation} />
                  </td>
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
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={m.assignment} />
                  </td>
                  <td className={`${tdClass} font-mono text-xs`}>{m.exitVoucherNo || "—"}</td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={m.requester} lines={1} />
                  </td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={m.siteName} lines={1} />
                  </td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={depotName(m.depotId)} lines={1} />
                  </td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={m.supplier} lines={1} />
                  </td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={m.deliveryNote} />
                  </td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={m.notes} />
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
              <SearchableEnumSelect
                options={STOCK_MOVEMENT_LABELS}
                value={movType}
                onChange={(v) => setMovType(v as StockMovementType)}
                allowEmpty={false}
                inputClassName={`${inputClass} mt-1`}
              />
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
              <SearchableEnumSelect
                options={stringOptions([...STOCK_UNITS])}
                value={movUnit}
                onChange={setMovUnit}
                allowEmpty={false}
                inputClassName={`${inputClass} mt-1`}
              />
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
