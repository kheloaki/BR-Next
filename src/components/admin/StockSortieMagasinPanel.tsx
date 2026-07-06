"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { traitementStockHref } from "@/lib/admin/stock-traitement-link";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { StockItemSelect } from "@/components/admin/StockItemSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { stringOptions } from "@/components/admin/searchable-options";
import type { AdminProject, StockItem, StockMovement } from "@/components/admin/operations-types";
import { STOCK_UNITS } from "@/components/admin/operations-types";
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
import { DEFAULT_VAT_RATE, formatMoney } from "@/lib/admin/price-ht-ttc";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";
import { formatDateFr, formatDateTimeFr } from "@/lib/admin/date-time-fr";

function fmtQty(n: number) {
  return n.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  items: StockItem[];
  movements: StockMovement[];
  projects: AdminProject[];
  saving: boolean;
  setSaving: (v: boolean) => void;
  onChanged: () => Promise<void>;
  toast: { success: (m: string) => void; error: (m: string) => void };
};

export function StockSortieMagasinPanel({
  items,
  movements,
  projects,
  saving,
  setSaving,
  onChanged,
  toast,
}: Props) {
  const exits = useMemo(
    () => movements.filter((m) => m.movementType === "exit"),
    [movements],
  );

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [itemId, setItemId] = useState("");
  const [movDate, setMovDate] = useState(new Date().toISOString().slice(0, 10));
  const [qty, setQty] = useState<number | "">(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [unit, setUnit] = useState("PIECE");
  const [articleCode, setArticleCode] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignment, setAssignment] = useState("");
  const [exitVoucherNo, setExitVoucherNo] = useState("");
  const [requester, setRequester] = useState("");
  const [storekeeper, setStorekeeper] = useState("");
  const [notes, setNotes] = useState("");

  const selectedItem = items.find((i) => i.id === itemId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exits;
    return exits.filter(
      (m) =>
        m.reference.toLowerCase().includes(q) ||
        m.designation.toLowerCase().includes(q) ||
        m.assignment.toLowerCase().includes(q) ||
        m.requester.toLowerCase().includes(q) ||
        m.exitVoucherNo.toLowerCase().includes(q),
    );
  }, [exits, search]);

  const { sort, onSort, applySort } = useTableSort("date", "desc");

  const exitSortAccessors = useMemo(
    () => ({
      date: (m: StockMovement) => m.movementDate,
      reference: (m: StockMovement) => m.reference,
      designation: (m: StockMovement) => m.designation,
      articleCode: (m: StockMovement) => m.articleCode,
      qty: (m: StockMovement) => m.qty,
      unit: (m: StockMovement) => m.unit,
      unitPrice: (m: StockMovement) => m.unitPrice,
      totalPriceHt: (m: StockMovement) => m.totalPriceHt,
      stockAfter: (m: StockMovement) => m.stockAfter,
      assignment: (m: StockMovement) => m.assignment,
      exitVoucherNo: (m: StockMovement) => m.exitVoucherNo,
      requester: (m: StockMovement) => m.requester,
      storekeeper: (m: StockMovement) => m.storekeeper,
      notes: (m: StockMovement) => m.notes,
    }),
    [],
  );

  const sortedFiltered = useMemo(
    () => applySort(filtered, exitSortAccessors),
    [filtered, applySort, exitSortAccessors],
  );

  function resetForm() {
    setEditId(null);
    setShowForm(false);
    setItemId("");
    setMovDate(new Date().toISOString().slice(0, 10));
    setQty(1);
    setUnitPrice(0);
    setUnit("PIECE");
    setArticleCode("");
    setProjectId("");
    setAssignment("");
    setExitVoucherNo("");
    setRequester("");
    setStorekeeper("");
    setNotes("");
  }

  function onItemChange(id: string) {
    setItemId(id);
    const item = items.find((i) => i.id === id);
    if (item) {
      setUnitPrice(item.unitPrice);
      setUnit(item.unit || "PIECE");
      setArticleCode(item.articleCode || "");
    }
  }

  function onProjectChange(id: string) {
    setProjectId(id);
    const p = projects.find((x) => x.id === id);
    if (p && !assignment.trim()) {
      setAssignment(p.code || p.name);
    }
  }

  function openEdit(m: StockMovement) {
    setEditId(m.id);
    setShowForm(true);
    setItemId(m.itemId);
    setMovDate(m.movementDate);
    setQty(m.qty);
    setUnitPrice(m.unitPrice);
    setUnit(m.unit || "PIECE");
    setArticleCode(m.articleCode);
    setProjectId(m.projectId ?? "");
    setAssignment(m.assignment);
    setExitVoucherNo(m.exitVoucherNo);
    setRequester(m.requester);
    setStorekeeper(m.storekeeper);
    setNotes(m.notes);
  }

  async function submit() {
    if (!itemId) {
      toast.error("Sélectionnez un article.");
      return;
    }
    const q = typeof qty === "number" ? qty : Number(qty);
    if (!q || q <= 0) {
      toast.error("Indiquez une quantité valide.");
      return;
    }
    if (!requester.trim()) {
      toast.error("Indiquez le demandeur.");
      return;
    }

    setSaving(true);
    const payload = {
      itemId,
      movementType: "exit" as const,
      movementDate: movDate,
      qty: q,
      unitPrice,
      unit,
      articleCode,
      projectId: projectId || undefined,
      assignment,
      exitVoucherNo: exitVoucherNo.trim() || undefined,
      requester,
      storekeeper,
      notes,
    };

    const res = editId
      ? await fetch("/api/admin/stock/movements", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        })
      : await fetch("/api/admin/stock/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const data = (await res.json()) as { exitVoucherNo?: string };
    toast.success(
      editId
        ? "Sortie mise à jour."
        : `Sortie enregistrée${data.exitVoucherNo ? ` — ${data.exitVoucherNo}` : ""}.`,
    );
    resetForm();
    await onChanged();
  }

  async function remove(m: StockMovement) {
    if (
      !(await confirmDelete(m.exitVoucherNo || m.reference, {
        title: "Supprimer la sortie",
        description: `Retirer la sortie du ${formatDateFr(m.movementDate)} ? Le stock sera recalculé.`,
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
    toast.success("Sortie supprimée.");
    if (editId === m.id) resetForm();
    await onChanged();
  }

  const previewStock =
    selectedItem && typeof qty === "number" && qty > 0
      ? selectedItem.qty - qty
      : selectedItem?.qty ?? null;

  return (
    <div className="space-y-4">
      <AdminInventoryCard
        title="Registre sortie de magasin"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Référence, désignation, affectation, demandeur…"
        actions={
          <>
            <p className="text-xs text-[var(--graphite)]/70 mr-2 self-center hidden lg:block">
              Sorties internes uniquement — ventes client via Traitement vente → BL
            </p>
            <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Nouvelle sortie
          </button>
          </>
        }
      >
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
            Aucune sortie enregistrée.
          </div>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr className="bg-[#fff9c4]/40">
                <AdminSortableTh label="Date" sortKey="date" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Référence" sortKey="reference" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Désignation" sortKey="designation" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Code art." sortKey="articleCode" sort={sort} onSort={onSort} />
                <AdminSortableTh
                  label="Quantité"
                  sortKey="qty"
                  sort={sort}
                  onSort={onSort}
                  className={`${thClass} text-right`}
                  align="right"
                />
                <AdminSortableTh label="Unité" sortKey="unit" sort={sort} onSort={onSort} />
                <AdminSortableTh
                  label="Prix unit. HT"
                  sortKey="unitPrice"
                  sort={sort}
                  onSort={onSort}
                  className={`${thClass} text-right`}
                  align="right"
                />
                <AdminSortableTh
                  label="Prix total HT"
                  sortKey="totalPriceHt"
                  sort={sort}
                  onSort={onSort}
                  className={`${thClass} text-right`}
                  align="right"
                />
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
                <AdminSortableTh label="Magasinier" sortKey="storekeeper" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Observation" sortKey="notes" sort={sort} onSort={onSort} />
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map((m) => (
                <tr key={m.id} className={rowHover}>
                  <td className={tdClass}>{formatDateFr(m.movementDate)}</td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={m.reference} lines={1} />
                  </td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={m.designation} />
                  </td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={m.articleCode} lines={1} />
                  </td>
                  <td className={`${tdClass} text-right tabular-nums`}>{fmtQty(m.qty)}</td>
                  <td className={tdClass}>{m.unit}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{fmtQty(m.unitPrice)}</td>
                  <td className={`${tdClass} text-right tabular-nums`}>{fmtQty(m.totalPriceHt)}</td>
                  <td
                    className={`${tdClass} text-right tabular-nums font-medium ${
                      m.stockAfter < 0 ? "text-red-600" : ""
                    }`}
                  >
                    {fmtQty(m.stockAfter)}
                  </td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={m.assignment} />
                  </td>
                  <td className={`${tdClass} font-mono text-xs`}>{m.exitVoucherNo || "—"}</td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={m.requester} lines={1} />
                  </td>
                  <td className={tdClass}>
                    <AdminTruncatedText text={m.storekeeper} lines={1} />
                  </td>
                  <td className={tdTextClass}>
                    <AdminTruncatedText text={m.notes} />
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      {m.traitementLink ? (
                        <Link
                          href={traitementStockHref(m.traitementLink)}
                          className={btnSecondary}
                        >
                          Traitement
                        </Link>
                      ) : (
                        <>
                          <button type="button" className={btnSecondary} onClick={() => openEdit(m)}>
                            Modif.
                          </button>
                          <button type="button" className={btnDanger} onClick={() => void remove(m)}>
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

      {showForm ? (
        <AdminFormCard
          title={editId ? "Modifier la sortie" : "Nouvelle sortie de magasin"}
          hint="Registre magasin — le N° bon sortie est généré automatiquement (BS-2026-001) si laissé vide."
          footer={
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnSecondary} onClick={resetForm}>
                Annuler
              </button>
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
                {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Enregistrer la sortie"}
              </button>
            </div>
          }
        >
          <div className={`${formGridClass} max-w-4xl`}>
            <div className="sm:col-span-2">
              <p className={labelClass}>Article *</p>
              <StockItemSelect
                items={items}
                value={itemId}
                onChange={onItemChange}
                inputClassName={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <p className={labelClass}>Date *</p>
              <input type="date" className={`${inputClass} mt-1`} value={movDate} onChange={(e) => setMovDate(e.target.value)} />
            </div>
            <div>
              <p className={labelClass}>Quantité *</p>
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${inputClass} mt-1`}
                value={qty}
                onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <p className={labelClass}>Unité</p>
              <SearchableEnumSelect
                options={stringOptions([...STOCK_UNITS])}
                value={unit}
                onChange={setUnit}
                allowEmpty={false}
                inputClassName={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <p className={labelClass}>Code article</p>
              <input className={`${inputClass} mt-1`} value={articleCode} onChange={(e) => setArticleCode(e.target.value)} />
            </div>
            <div>
              <p className={labelClass}>Prix unitaire HT</p>
              <HtTtcPriceFields vatRate={DEFAULT_VAT_RATE} valueHt={unitPrice} onChangeHt={setUnitPrice} />
            </div>
            <div>
              <p className={labelClass}>Chantier / projet</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={projectId} onChange={onProjectChange} allowEmpty />
              </div>
            </div>
            <div>
              <p className={labelClass}>Affectation</p>
              <input
                className={`${inputClass} mt-1`}
                placeholder="PE-80, ATELIER, immat…"
                value={assignment}
                onChange={(e) => setAssignment(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>N° bon sortie</p>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Auto BS-2026-001"
                value={exitVoucherNo}
                onChange={(e) => setExitVoucherNo(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>Demandeur *</p>
              <input className={`${inputClass} mt-1`} value={requester} onChange={(e) => setRequester(e.target.value)} />
            </div>
            <div>
              <p className={labelClass}>Magasinier</p>
              <input className={`${inputClass} mt-1`} value={storekeeper} onChange={(e) => setStorekeeper(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <p className={labelClass}>Observation</p>
              <textarea className={`${inputClass} mt-1`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {previewStock != null ? (
              <p className="sm:col-span-2 text-sm text-[var(--navy)]">
                Stock final prévu :{" "}
                <strong className={previewStock < 0 ? "text-red-600" : ""}>
                  {fmtQty(previewStock)} {unit}
                </strong>
                {previewStock < 0 ? " — stock négatif (comme sur le registre papier)" : null}
                {typeof qty === "number" && qty > 0 ? (
                  <span className="text-[var(--graphite)]/75">
                    {" "}
                    · Total HT : {formatMoney(qty * unitPrice)} MAD
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
        </AdminFormCard>
      ) : null}
    </div>
  );
}
