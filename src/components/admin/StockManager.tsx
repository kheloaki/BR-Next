"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { StockStatusBadge } from "@/components/admin/StatusBadge";
import { StockSortieMagasinPanel } from "@/components/admin/StockSortieMagasinPanel";
import { StockMovementHistoryPanel } from "@/components/admin/StockMovementHistoryPanel";
import { DeliveryNoteSelect } from "@/components/admin/DeliveryNoteSelect";
import { DepotSelect } from "@/components/admin/DepotSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import {
  STOCK_MOVEMENT_LABELS,
  STOCK_UNITS,
  type StockItem,
  type StockMovement,
  type StockMovementType,
} from "@/components/admin/operations-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  inventoryTableClass,
  labelClass,
  inventoryTdClass,
  inventoryTdNumClass,
  inventoryThClass,
  inventoryThNumClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminEmptyState } from "@/components/admin/ux/AdminEmptyState";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { ReferentialBanner } from "@/components/admin/ux/ReferentialBanner";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function StockManager() {
  const toast = useAdminToast();
  const [tab, setTab] = useState("inventory");
  const [items, setItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const { projects, depots, equipment, employees, refresh: refreshRef } = useOpsReferential();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [historyItemFilter, setHistoryItemFilter] = useState("");

  const [ref, setRef] = useState("");
  const [designation, setDesignation] = useState("");
  const [category, setCategory] = useState("");
  const [articleCode, setArticleCode] = useState("");
  const [unit, setUnit] = useState("PIECE");
  const [qty, setQty] = useState(0);
  const [minQty, setMinQty] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);

  const [movItemId, setMovItemId] = useState("");
  const [movType, setMovType] = useState<StockMovementType>("entry");
  const [movQty, setMovQty] = useState(0);
  const [movProjectId, setMovProjectId] = useState("");
  const [movDepotId, setMovDepotId] = useState("");
  const [movSupplier, setMovSupplier] = useState("");
  const [movBl, setMovBl] = useState("");
  const [movNotes, setMovNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [itemsRes, movRes] = await Promise.all([
      fetch("/api/admin/stock/items", { cache: "no-store" }),
      fetch("/api/admin/stock/movements", { cache: "no-store" }),
    ]);
    if (itemsRes.ok) setItems((await itemsRes.json()) as StockItem[]);
    if (movRes.ok) setMovements((await movRes.json()) as StockMovement[]);
    await refreshRef();
    setLoading(false);
  }, [refreshRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const alerts = useMemo(() => items.filter((i) => i.status !== "ok"), [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (statusFilter && i.status !== statusFilter) return false;
      if (!q) return true;
      return (
        i.reference.toLowerCase().includes(q) ||
        i.designation.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter]);

  const movementCountByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of movements) {
      map.set(m.itemId, (map.get(m.itemId) ?? 0) + 1);
    }
    return map;
  }, [movements]);

  const stockValue = useMemo(
    () => items.reduce((a, i) => a + i.qty * i.unitPrice, 0),
    [items],
  );

  async function saveItem() {
    if (!designation.trim()) {
      toast.error("La désignation est obligatoire.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/stock/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editItemId ?? undefined,
        reference: ref.trim(),
        designation: designation.trim(),
        category: category.trim(),
        articleCode: articleCode.trim(),
        unit: unit.trim() || "PIECE",
        qty,
        minQty,
        unitPrice,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editItemId ? "Article mis à jour." : "Article ajouté au stock.");
    resetItemForm();
    await load();
  }

  function resetItemForm() {
    setEditItemId(null);
    setRef("");
    setDesignation("");
    setCategory("");
    setArticleCode("");
    setUnit("PIECE");
    setQty(0);
    setMinQty(0);
    setUnitPrice(0);
    setShowAddForm(false);
  }

  function openEditItem(item: StockItem) {
    setEditItemId(item.id);
    setRef(item.reference);
    setDesignation(item.designation);
    setCategory(item.category);
    setArticleCode(item.articleCode || "");
    setUnit(item.unit || "PIECE");
    setQty(item.qty);
    setMinQty(item.minQty);
    setUnitPrice(item.unitPrice);
    setShowAddForm(true);
    setTab("inventory");
    requestAnimationFrame(() => {
      document.getElementById("stock-add-form")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function openHistoryForItem(itemId: string) {
    setHistoryItemFilter(itemId);
    setTab("history");
  }

  function openAddForm() {
    resetItemForm();
    setTab("inventory");
    setShowAddForm(true);
    requestAnimationFrame(() => {
      document.getElementById("stock-add-form")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  async function submitMovement() {
    if (!movItemId) {
      toast.error("Sélectionnez un article.");
      return;
    }
    if (movQty <= 0) {
      toast.error("Indiquez une quantité valide.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/stock/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: movItemId,
        movementType: movType,
        qty: movQty,
        projectId: movProjectId,
        depotId: movDepotId,
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
    toast.success("Mouvement enregistré — quantités mises à jour.");
    setMovQty(0);
    setMovNotes("");
    await load();
    setTab("inventory");
  }

  async function removeItem(item: StockItem) {
    if (!(await confirmDelete(`${item.reference} — ${item.designation}`))) return;
    const res = await fetch(`/api/admin/stock/items?id=${encodeURIComponent(item.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Article supprimé.");
    await load();
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Gestion de stock"
        description="Pièces et consommables (hors gasoil — voir Carburant → Stock gasoil)."
        exportHref="/api/admin/stock/items?format=csv"
        actions={
          <button type="button" className={btnPrimary} onClick={openAddForm}>
            Nouvel article
          </button>
        }
      />

      <ReferentialBanner sitesCount={projects.length} equipmentCount={equipment.length} requireSites requireEquipment />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Articles", value: String(items.length) },
            {
              label: "Alertes",
              value: String(alerts.length),
              accent: alerts.length > 0 ? "alert" : undefined,
            },
            { label: "Valeur stock", value: `${stockValue.toLocaleString("fr-MA")} MAD` },
            { label: "Mouvements", value: String(movements.length), hint: "voir historique" },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "inventory", label: "Inventaire" },
          { id: "sortie", label: "Sortie magasin", badge: movements.filter((m) => m.movementType === "exit").length || undefined },
          { id: "history", label: "Historique", badge: movements.length || undefined },
          { id: "movement", label: "Saisir mouvement" },
          { id: "alerts", label: "Alertes", badge: alerts.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <AdminLoading /> : null}

      {!loading && tab === "inventory" && (
        <>
          <AdminInventoryCard
            title="Inventaire des articles"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher un article…"
            actions={
              <select
                className={`${inputClass} max-w-[160px] min-h-[38px] py-2`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous statuts</option>
                <option value="ok">En stock</option>
                <option value="low">Stock bas</option>
                <option value="out">Rupture</option>
              </select>
            }
          >
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                Aucun article pour ce filtre.
                <button type="button" className={`mt-4 block mx-auto ${btnPrimary}`} onClick={openAddForm}>
                  Ajouter un article
                </button>
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={inventoryThClass}>Référence</th>
                    <th className={inventoryThClass}>Désignation</th>
                    <th className={inventoryThClass}>Catégorie</th>
                    <th className={inventoryThNumClass}>Qté dispo</th>
                    <th className={inventoryThNumClass}>Stock min</th>
                    <th className={inventoryThNumClass}>Prix unit. MAD</th>
                    <th className={inventoryThNumClass}>Valeur MAD</th>
                    <th className={inventoryThClass}>Statut</th>
                    <th className={inventoryThClass} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--background)]/80 transition-colors">
                      <td className={inventoryTdClass}>{item.reference}</td>
                      <td className={inventoryTdClass}>{item.designation}</td>
                      <td className={inventoryTdClass}>{item.category || "—"}</td>
                      <td className={inventoryTdNumClass}>{item.qty}</td>
                      <td className={inventoryTdNumClass}>{item.minQty}</td>
                      <td className={inventoryTdNumClass}>{item.unitPrice.toLocaleString("fr-MA")}</td>
                      <td className={inventoryTdNumClass}>
                        {(item.qty * item.unitPrice).toLocaleString("fr-MA")}
                      </td>
                      <td className={inventoryTdClass}>
                        <StockStatusBadge status={item.status} />
                      </td>
                      <td className={inventoryTdClass}>
                        <div className="flex flex-wrap gap-1">
                          <button type="button" className={btnSecondary} onClick={() => openEditItem(item)}>
                            Modifier
                          </button>
                          <button type="button" className={btnSecondary} onClick={() => openHistoryForItem(item.id)}>
                            Historique
                            {(movementCountByItem.get(item.id) ?? 0) > 0
                              ? ` (${movementCountByItem.get(item.id)})`
                              : ""}
                          </button>
                          <button type="button" className={btnDanger} onClick={() => void removeItem(item)}>
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

          {showAddForm ? (
            <div id="stock-add-form" className="mt-4">
            <AdminFormCard
              title={editItemId ? "Modifier l'article" : "Nouvel article"}
              hint={
                editItemId
                  ? "Les mouvements passés ne sont pas modifiés — ajustez la quantité ici ou via l'historique."
                  : "Le seuil minimum déclenche une alerte dans l'onglet Alertes."
              }
              footer={
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={btnSecondary} onClick={() => resetItemForm()}>
                    Annuler
                  </button>
                  <button type="button" className={btnPrimary} disabled={saving} onClick={() => void saveItem()}>
                    {saving ? "Enregistrement…" : editItemId ? "Enregistrer" : "Ajouter l'article"}
                  </button>
                </div>
              }
            >
              <div className={formGridClass}>
                <div>
                  <p className={labelClass}>Référence</p>
                  <input className={`${inputClass} mt-1`} value={ref} onChange={(e) => setRef(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <p className={labelClass}>Désignation *</p>
                  <input
                    className={`${inputClass} mt-1`}
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
                <div>
                  <p className={labelClass}>Catégorie</p>
                  <input className={`${inputClass} mt-1`} value={category} onChange={(e) => setCategory(e.target.value)} />
                </div>
                <div>
                  <p className={labelClass}>Code article</p>
                  <input className={`${inputClass} mt-1`} value={articleCode} onChange={(e) => setArticleCode(e.target.value)} />
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
                  <p className={labelClass}>Qté en stock</p>
                  <input type="number" min={0} className={`${inputClass} mt-1`} value={qty || ""} onChange={(e) => setQty(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <p className={labelClass}>Seuil minimum</p>
                  <input type="number" min={0} className={`${inputClass} mt-1`} value={minQty || ""} onChange={(e) => setMinQty(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <p className={labelClass}>Prix unitaire (MAD)</p>
                  <input type="number" min={0} className={`${inputClass} mt-1`} value={unitPrice || ""} onChange={(e) => setUnitPrice(Number(e.target.value) || 0)} />
                </div>
              </div>
            </AdminFormCard>
            </div>
          ) : null}
        </>
      )}

      {!loading && tab === "sortie" && (
        <StockSortieMagasinPanel
          items={items}
          movements={movements}
          projects={projects}
          saving={saving}
          setSaving={setSaving}
          onChanged={load}
          toast={toast}
        />
      )}

      {!loading && tab === "history" && (
        <StockMovementHistoryPanel
          movements={movements}
          items={items}
          projects={projects}
          depots={depots}
          filterItemId={historyItemFilter}
          onFilterItemIdChange={setHistoryItemFilter}
          saving={saving}
          setSaving={setSaving}
          onChanged={load}
          toast={toast}
        />
      )}

      {!loading && tab === "movement" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <AdminFormCard
            title="Enregistrer un mouvement"
            hint="La quantité en stock est recalculée automatiquement."
            footer={
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitMovement()}>
                {saving ? "Enregistrement…" : "Valider le mouvement"}
              </button>
            }
          >
            <select className={inputClass} value={movItemId} onChange={(e) => setMovItemId(e.target.value)}>
              <option value="">Article…</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.reference} — {i.designation} (stock: {i.qty})
                </option>
              ))}
            </select>
            <select className={inputClass} value={movType} onChange={(e) => setMovType(e.target.value as StockMovementType)}>
              {(Object.keys(STOCK_MOVEMENT_LABELS) as StockMovementType[]).map((k) => (
                <option key={k} value={k}>
                  {STOCK_MOVEMENT_LABELS[k]}
                </option>
              ))}
            </select>
            <input type="number" min={0} className={inputClass} placeholder="Quantité" value={movQty || ""} onChange={(e) => setMovQty(Number(e.target.value) || 0)} />
            <DepotSelect depots={depots} value={movDepotId} onChange={setMovDepotId} placeholder="Dépôt" />
            <ProjectSelect projects={projects} value={movProjectId} onChange={setMovProjectId} placeholder="Projet (optionnel)" />
            <input className={inputClass} placeholder="Fournisseur (optionnel)" value={movSupplier} onChange={(e) => setMovSupplier(e.target.value)} />
            <DeliveryNoteSelect value={movBl} onChange={setMovBl} label="N° bon de livraison" />
            <textarea className={inputClass} placeholder="Notes" rows={2} value={movNotes} onChange={(e) => setMovNotes(e.target.value)} />
          </AdminFormCard>

          <AdminFormCard title="Derniers mouvements" hint="15 opérations les plus récentes">
            {movements.length === 0 ? (
              <p className="text-sm text-[var(--graphite)]/70">Aucun mouvement enregistré.</p>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={thClass}>Date</th>
                    <th className={thClass}>Article</th>
                    <th className={thClass}>Type</th>
                    <th className={thClass}>Qté</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.slice(0, 15).map((m) => (
                    <tr key={m.id} className={rowHover}>
                      <td className={tdClass}>{m.movementDate}</td>
                      <td className={tdClass}>{m.designation}</td>
                      <td className={tdClass}>{STOCK_MOVEMENT_LABELS[m.movementType]}</td>
                      <td className={tdClass}>{m.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </AdminFormCard>
        </div>
      )}

      {!loading && tab === "alerts" && (
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <AdminEmptyState
              title="Aucune alerte"
              description="Tous les articles respectent leur seuil minimum. Continuez à suivre l'inventaire régulièrement."
            />
          ) : (
            alerts.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-[#f0d4b8] bg-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm"
              >
                <div>
                  <p className="font-medium text-[var(--navy)]">
                    {item.reference} — {item.designation}
                  </p>
                  <p className="text-xs text-[var(--graphite)]/70 mt-1">
                    Stock {item.qty} · seuil {item.minQty}
                    {item.qty > 0 && item.minQty > 0 ? ` · manque ~${Math.max(0, item.minQty - item.qty)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StockStatusBadge status={item.status} />
                  <Link
                    href={`/admin/purchase-requests?ref=${encodeURIComponent(item.reference)}&designation=${encodeURIComponent(item.designation)}&category=parts`}
                    className={btnPrimary}
                  >
                    Créer DA
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
