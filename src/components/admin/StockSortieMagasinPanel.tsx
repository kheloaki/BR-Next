"use client";

import { useMemo, useState } from "react";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
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
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { DEFAULT_VAT_RATE, formatMoney } from "@/lib/admin/price-ht-ttc";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";

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
        description: `Retirer la sortie du ${m.movementDate} ? Le stock sera recalculé.`,
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
                <th className={thClass}>Date</th>
                <th className={thClass}>Référence</th>
                <th className={thClass}>Désignation</th>
                <th className={thClass}>Code art.</th>
                <th className={`${thClass} text-right`}>Quantité</th>
                <th className={thClass}>Unité</th>
                <th className={`${thClass} text-right`}>Prix unit. HT</th>
                <th className={`${thClass} text-right`}>Prix total HT</th>
                <th className={`${thClass} text-right`}>Stock final</th>
                <th className={thClass}>Affectation</th>
                <th className={thClass}>N° bon sortie</th>
                <th className={thClass}>Demandeur</th>
                <th className={thClass}>Magasinier</th>
                <th className={thClass}>Observation</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className={rowHover}>
                  <td className={tdClass}>{m.movementDate}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{m.reference}</td>
                  <td className={tdClass}>{m.designation}</td>
                  <td className={tdClass}>{m.articleCode || "—"}</td>
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
                  <td className={tdClass}>{m.assignment || "—"}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{m.exitVoucherNo || "—"}</td>
                  <td className={tdClass}>{m.requester || "—"}</td>
                  <td className={tdClass}>{m.storekeeper || "—"}</td>
                  <td className={`${tdClass} max-w-[100px] truncate`} title={m.notes}>
                    {m.notes || "—"}
                  </td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" className={btnSecondary} onClick={() => openEdit(m)}>
                        Modif.
                      </button>
                      <button type="button" className={btnDanger} onClick={() => void remove(m)}>
                        Suppr.
                      </button>
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
              <select className={`${inputClass} mt-1`} value={itemId} onChange={(e) => onItemChange(e.target.value)}>
                <option value="">— Sélectionner —</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.reference} — {i.designation} (stock: {i.qty} {i.unit})
                  </option>
                ))}
              </select>
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
              <select className={`${inputClass} mt-1`} value={unit} onChange={(e) => setUnit(e.target.value)}>
                {STOCK_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
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
