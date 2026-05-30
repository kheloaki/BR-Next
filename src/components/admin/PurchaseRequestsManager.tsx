"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { PurchaseStatusBadge } from "@/components/admin/StatusBadge";
import {
  PURCHASE_CATEGORY_LABELS,
  type PurchaseCategory,
  type PurchaseRequest,
  type PurchaseRequestStatus,
} from "@/components/admin/operations-types";
import {
  btnLinkDanger,
  btnLinkSuccess,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
  moduleWrap,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import { DEFAULT_VAT_RATE, formatMoney, htToTtc } from "@/lib/admin/price-ht-ttc";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function PurchaseRequestsManager() {
  const toast = useAdminToast();
  const searchParams = useSearchParams();
  const { projects } = useOpsReferential();
  const [tab, setTab] = useState("list");
  const [rows, setRows] = useState<PurchaseRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [projectId, setProjectId] = useState(searchParams.get("project") ?? "");
  const [category, setCategory] = useState<PurchaseCategory>(
    (searchParams.get("category") as PurchaseCategory) || "parts",
  );
  const [subject, setSubject] = useState(
    searchParams.get("designation")
      ? `Réappro — ${searchParams.get("designation")}`
      : searchParams.get("ref")
        ? `Réappro — ${searchParams.get("ref")}`
        : "",
  );
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [urgency, setUrgency] = useState("Normale");
  const [requester, setRequester] = useState("");
  const [justification, setJustification] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const url = statusFilter
      ? `/api/admin/purchase-requests?status=${encodeURIComponent(statusFilter)}`
      : "/api/admin/purchase-requests";
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as PurchaseRequest[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("ref") || searchParams.get("designation")) {
      setTab("new");
    }
  }, [searchParams]);

  const pending = rows.filter((r) => r.status === "pending").length;
  const totalAmount = rows.reduce((a, r) => a + r.totalAmount, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.subject.toLowerCase().includes(q) ||
        r.number.toLowerCase().includes(q) ||
        (r.supplier || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function createDa() {
    if (!subject.trim()) {
      toast.error("Indiquez l'objet de la demande.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/purchase-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        subject,
        qty,
        unitPrice,
        supplier,
        urgency,
        requester,
        justification,
        projectId: projectId || undefined,
        prefillReference: searchParams.get("ref") || undefined,
        prefillDesignation: searchParams.get("designation") || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Demande d'achat soumise.");
    setSubject("");
    setJustification("");
    await load();
    setTab("list");
  }

  async function setStatus(id: string, status: PurchaseRequestStatus) {
    const row = rows.find((r) => r.id === id);
    if (status === "rejected" && row) {
      const ok = await confirmDelete(row.number, {
        title: "Rejeter la demande",
        description: `Rejeter la DA « ${row.number} » — ${row.subject} ?`,
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

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Demandes d'achat"
        description="Suivi des DA, validation et lien avec les alertes stock."
        exportHref="/api/admin/purchase-requests?format=csv"
        actions={
          <button type="button" className={btnPrimary} onClick={() => setTab("new")}>
            Nouvelle DA
          </button>
        }
      />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "DA total", value: String(rows.length) },
            { label: "En attente", value: String(pending), accent: pending > 0 ? "alert" : undefined },
            { label: "Montant", value: `${totalAmount.toLocaleString("fr-MA")} MAD` },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "list", label: "Liste", badge: pending || undefined },
          { id: "new", label: "Nouvelle DA" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <AdminLoading /> : null}

      {!loading && tab === "list" ? (
        <AdminInventoryCard
            title="Liste des demandes"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="N°, objet, fournisseur…"
            actions={
              <select
                className={`${inputClass} max-w-[200px] min-h-[38px] py-2`}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvée</option>
                <option value="rejected">Rejetée</option>
              </select>
            }
          >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search || statusFilter
                ? "Aucun résultat pour ce filtre."
                : "Aucune demande d'achat enregistrée."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setTab("new")}>
                Nouvelle DA
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>N°</th>
                  <th className={thClass}>Objet</th>
                  <th className={thClass}>Catégorie</th>
                  <th className={thClass}>Montant</th>
                  <th className={thClass}>Statut</th>
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>{r.number}</td>
                    <td className={tdClass}>{r.subject}</td>
                    <td className={tdClass}>{PURCHASE_CATEGORY_LABELS[r.category]}</td>
                    <td className={tdClass}>{r.totalAmount.toLocaleString("fr-MA")} MAD</td>
                    <td className={tdClass}>
                      <PurchaseStatusBadge status={r.status} />
                    </td>
                    <td className={tdClass}>
                      {r.status === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={btnLinkSuccess} onClick={() => void setStatus(r.id, "approved")}>
                            Approuver
                          </button>
                          <button type="button" className={btnLinkDanger} onClick={() => void setStatus(r.id, "rejected")}>
                            Rejeter
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {!loading && tab === "new" ? (
        <AdminFormCard
          title="Nouvelle demande"
          hint={
            searchParams.get("designation")
              ? `Prérempli depuis l'alerte stock : ${searchParams.get("designation")}`
              : undefined
          }
          footer={
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void createDa()}>
              {saving ? "Envoi…" : "Soumettre la DA"}
            </button>
          }
        >
          <div className="max-w-xl space-y-4">
            <div>
              <p className={labelClass}>Projet / chantier</p>
              <div className="mt-1">
                <ProjectSelect projects={projects} value={projectId} onChange={setProjectId} allowEmpty />
              </div>
            </div>
            <div>
              <p className={labelClass}>Catégorie</p>
              <select
                className={`${inputClass} mt-1`}
                value={category}
                onChange={(e) => setCategory(e.target.value as PurchaseCategory)}
              >
                {(Object.keys(PURCHASE_CATEGORY_LABELS) as PurchaseCategory[]).map((k) => (
                  <option key={k} value={k}>
                    {PURCHASE_CATEGORY_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>Objet *</p>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Description de la demande"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>Quantité</p>
              <input
                type="number"
                min={0}
                className={`${inputClass} mt-1`}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || 0)}
              />
            </div>
            <HtTtcPriceFields vatRate={DEFAULT_VAT_RATE} valueHt={unitPrice} onChangeHt={setUnitPrice} />
            <div>
              <p className={labelClass}>Fournisseur</p>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Nom du fournisseur"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>Urgence</p>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Normale, Urgente…"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>Demandeur</p>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Nom du demandeur"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>Justification</p>
              <textarea
                className={`${inputClass} mt-1`}
                rows={3}
                placeholder="Motif et contexte de la demande"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
            <p className="text-sm text-[var(--navy)]">
              Montant HT : <strong>{formatMoney(qty * unitPrice)} MAD</strong>
              <span className="text-[var(--graphite)]/75">
                {" "}
                · TTC : {formatMoney(qty * htToTtc(unitPrice, DEFAULT_VAT_RATE))} MAD
              </span>
            </p>
          </div>
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
