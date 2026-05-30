"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { PurchaseStatusBadge } from "@/components/admin/StatusBadge";
import type { AdminProject, PurchaseRequest, PurchaseRequestStatus, StockItem } from "@/components/admin/operations-types";
import { PURCHASE_STATUS_LABELS } from "@/components/admin/operations-types";
import {
  btnLinkDanger,
  btnLinkSuccess,
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
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

type PanelTab = "list" | "new";

export function FuelGasoilDaPanel({
  projects,
  projectIdFromUrl,
}: {
  projects: AdminProject[];
  projectIdFromUrl?: string;
}) {
  const toast = useAdminToast();
  const [panelTab, setPanelTab] = useState<PanelTab>("list");
  const [rows, setRows] = useState<PurchaseRequest[]>([]);
  const [gasoilStock, setGasoilStock] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [projectId, setProjectId] = useState(projectIdFromUrl ?? "");
  const [pumpMeter, setPumpMeter] = useState("");
  const [qty, setQty] = useState<number | "">("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [requester, setRequester] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [daRes, stockRes] = await Promise.all([
      fetch("/api/admin/purchase-requests?gasoil=1", { cache: "no-store" }),
      fetch("/api/admin/fuel/stock", { cache: "no-store" }),
    ]);
    if (daRes.ok) setRows((await daRes.json()) as PurchaseRequest[]);
    if (stockRes.ok) {
      const { item } = (await stockRes.json()) as { item: StockItem | null };
      setGasoilStock(item);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (projectIdFromUrl) setProjectId(projectIdFromUrl);
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
        r.subject.toLowerCase().includes(q) ||
        projectName(r.projectId).toLowerCase().includes(q),
    );
  }, [rows, search, projects]);

  async function submitGasoilDa() {
    if (!projectId) {
      toast.error("Sélectionnez un chantier.");
      return;
    }
    if (!deliveryDate) {
      toast.error("Indiquez la date de livraison.");
      return;
    }
    const litres = typeof qty === "number" ? qty : Number(qty);
    if (!litres || litres <= 0) {
      toast.error("Indiquez la quantité demandée (litres).");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "gasoil",
        projectId,
        qty: litres,
        deliveryDate,
        requester,
        pumpMeter: pumpMeter.trim() ? Number(pumpMeter) : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const created = (await res.json()) as PurchaseRequest;
    toast.success(`DA enregistrée : ${created.number}`);
    setPumpMeter("");
    setQty("");
    setDeliveryDate("");
    setRequester("");
    await load();
    setPanelTab("list");
  }

  async function setStatus(id: string, status: PurchaseRequestStatus) {
    const row = rows.find((r) => r.id === id);
    if (status === "rejected" && row) {
      const ok = await confirmDelete(row.number, {
        title: "Rejeter la DA Gasoil",
        description: `Rejeter « ${row.number} » ?`,
        confirmLabel: "Rejeter",
        cancelLabel: "Annuler",
      });
      if (!ok) return;
    }
    const res = await fetch("/api/admin/purchase-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(status === "approved" ? "DA approuvée." : "DA rejetée.");
    await load();
  }

  if (loading) return <AdminLoading />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={panelTab === "list" ? btnPrimary : btnSecondary}
          onClick={() => setPanelTab("list")}
        >
          Liste DA Gasoil
        </button>
        <button
          type="button"
          className={panelTab === "new" ? btnPrimary : btnSecondary}
          onClick={() => setPanelTab("new")}
        >
          Nouvelle DA Gasoil
        </button>
      </div>

      {panelTab === "list" ? (
        <AdminInventoryCard
          title="DA Gasoil"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="N° DA, chantier…"
          actions={
            <button type="button" className={btnPrimary} onClick={() => setPanelTab("new")}>
              Nouvelle DA
            </button>
          }
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              Aucune DA Gasoil enregistrée.
              <button type="button" className={`mt-4 block mx-auto ${btnPrimary}`} onClick={() => setPanelTab("new")}>
                Créer une DA Gasoil
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>DA Gasoil</th>
                  <th className={thClass}>Chantier</th>
                  <th className={thClass}>Stock ins.</th>
                  <th className={thClass}>Cpt. pompe</th>
                  <th className={thClass}>Qté dem.</th>
                  <th className={thClass}>Livraison</th>
                  <th className={thClass}>Statut</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={`${tdClass} font-mono text-xs`}>{r.number}</td>
                    <td className={tdClass}>{projectName(r.projectId)}</td>
                    <td className={tdClass}>
                      {r.stockQtyAtRequest != null
                        ? `${r.stockQtyAtRequest.toLocaleString("fr-MA")} L`
                        : "—"}
                    </td>
                    <td className={tdClass}>
                      {r.pumpMeter != null ? r.pumpMeter.toLocaleString("fr-MA") : "—"}
                    </td>
                    <td className={tdClass}>{r.qty.toLocaleString("fr-MA")} L</td>
                    <td className={tdClass}>{r.deliveryDate || "—"}</td>
                    <td className={tdClass}>
                      <PurchaseStatusBadge status={r.status} />
                    </td>
                    <td className={tdClass}>
                      {r.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={btnLinkSuccess}
                            onClick={() => void setStatus(r.id, "approved")}
                          >
                            Approuver
                          </button>
                          <button
                            type="button"
                            className={btnLinkDanger}
                            onClick={() => void setStatus(r.id, "rejected")}
                          >
                            Rejeter
                          </button>
                        </div>
                      ) : (
                        PURCHASE_STATUS_LABELS[r.status]
                      )}
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
          title="Nouvelle DA Gasoil"
          hint="Demande d'achat carburant liée au chantier. Le stock gasoil s'affiche s'il existe en inventaire."
          footer={
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnSecondary} onClick={() => setPanelTab("list")}>
                Annuler
              </button>
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitGasoilDa()}>
                {saving ? "Enregistrement…" : "Enregistrer la DA"}
              </button>
            </div>
          }
        >
          <div className="grid max-w-xl gap-4">
            <div>
              <p className={labelClass}>DA Gasoil</p>
              <p className="mt-1 text-sm text-[var(--graphite)]/75">
                Numéro généré à l&apos;enregistrement (ex. DA-GASOIL-2026-001)
              </p>
            </div>

            <div>
              <p className={labelClass}>Chantier *</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} />
              </div>
            </div>

            <div>
              <p className={labelClass}>Stock ins</p>
              <input
                className={`${inputClass} mt-1 bg-[var(--background)]`}
                readOnly
                value={
                  gasoilStock
                    ? `${gasoilStock.qty.toLocaleString("fr-MA")} L — ${gasoilStock.reference || gasoilStock.designation}`
                    : ""
                }
                placeholder="Aucun gasoil en stock (laisser vide)"
              />
              {!gasoilStock ? (
                <p className="mt-1 text-xs text-[var(--graphite)]/65">
                  Stock non configuré — onglet <strong>Stock gasoil</strong> pour initialiser.
                </p>
              ) : null}
            </div>

            <div>
              <p className={labelClass}>Compteur pompe</p>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                placeholder="Relevé compteur"
                value={pumpMeter}
                onChange={(e) => setPumpMeter(e.target.value)}
              />
            </div>

            <div>
              <p className={labelClass}>Qté demandée *</p>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                placeholder="Litres"
                value={qty}
                onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <p className={labelClass}>Date de livraison *</p>
              <input
                type="date"
                className={`${inputClass} mt-1`}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            <div>
              <p className={labelClass}>Demandeur</p>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Optionnel"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
              />
            </div>
          </div>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
