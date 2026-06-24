"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { withEmptyOption } from "@/components/admin/searchable-options";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { PurchaseRequestSheet } from "@/components/admin/PurchaseRequestSheet";
import {
  PurchaseRequestKindPickerSheet,
  type PurchaseRequestDaKind,
} from "@/components/admin/PurchaseRequestKindPickerSheet";
import { PurchaseStatusBadge } from "@/components/admin/StatusBadge";
import type { Product } from "@/components/admin/devis-types";
import {
  PURCHASE_CATEGORY_LABELS,
  type PurchaseRequest,
  type PurchaseRequestStatus,
} from "@/components/admin/operations-types";
import {
  btnLinkDanger,
  btnLinkSuccess,
  btnPrimary,
  btnSecondary,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { PurchaseRequestsPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { isGasoilPurchaseRequest } from "@/lib/admin/map-purchase-request";
import { traitementsHref } from "@/lib/admin/traitement-nav";

export function PurchaseRequestsManager() {
  const toast = useAdminToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects } = useOpsReferential();
  const [tab, setTab] = useState("list");
  const [rows, setRows] = useState<PurchaseRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [kindPickerOpen, setKindPickerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<PurchaseRequestDaKind>("articles");
  const [viewRequest, setViewRequest] = useState<PurchaseRequest | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  function openNewDa() {
    setKindPickerOpen(true);
  }

  function startCreate(kind: PurchaseRequestDaKind) {
    setCreateKind(kind);
    setKindPickerOpen(false);
    setCreateOpen(true);
  }

  const stockPrefill = useMemo(
    () => ({
      projectId: searchParams.get("project") ?? undefined,
      reference: searchParams.get("ref") ?? undefined,
      designation: searchParams.get("designation") ?? undefined,
      stockItemId: searchParams.get("stockItemId") ?? undefined,
    }),
    [searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const url = statusFilter
      ? `/api/admin/purchase-requests?status=${encodeURIComponent(statusFilter)}`
      : "/api/admin/purchase-requests";
    const [daRes, productsRes] = await Promise.all([
      fetch(url, { cache: "no-store" }),
      fetch("/api/admin/products", { cache: "no-store" }),
    ]);
    if (daRes.ok) setRows((await daRes.json()) as PurchaseRequest[]);
    if (productsRes.ok) setProducts((await productsRes.json()) as Product[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const newParam = searchParams.get("new");
    if (newParam === "gasoil") {
      setCreateKind("gasoil");
      setCreateOpen(true);
      return;
    }
    if (newParam === "articles") {
      setCreateKind("articles");
      setCreateOpen(true);
      return;
    }
    if (newParam === "1") {
      setKindPickerOpen(true);
      return;
    }
    if (searchParams.get("ref") || searchParams.get("designation")) {
      setCreateKind("articles");
      setCreateOpen(true);
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

  const { sort, onSort, applySort } = useTableSort("number", "desc");

  const purchaseSortAccessors = useMemo(
    () => ({
      number: (r: PurchaseRequest) => r.number,
      type: (r: PurchaseRequest) => (isGasoilPurchaseRequest(r) ? "gasoil" : "articles"),
      subject: (r: PurchaseRequest) => r.subject,
      category: (r: PurchaseRequest) => PURCHASE_CATEGORY_LABELS[r.category],
      amount: (r: PurchaseRequest) => r.totalAmount,
      status: (r: PurchaseRequest) => r.status,
      traitement: (r: PurchaseRequest) => r.traitementId ?? "",
    }),
    [],
  );

  const sortedFiltered = useMemo(
    () => applySort(filtered, purchaseSortAccessors),
    [filtered, applySort, purchaseSortAccessors],
  );

  const statusFilterOptions = useMemo(
    () =>
      withEmptyOption(
        [
          { value: "pending", label: "En attente" },
          { value: "approved", label: "Approuvée" },
          { value: "rejected", label: "Rejetée" },
        ],
        "Tous statuts",
      ),
    [],
  );

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

  async function convertToTraitement(row: PurchaseRequest) {
    setConvertingId(row.id);
    const res = await fetch(`/api/admin/purchase-requests/${encodeURIComponent(row.id)}/traitement`, {
      method: "POST",
    });
    setConvertingId(null);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const { traitementId } = (await res.json()) as { traitementId: string };
    toast.success("Traitement achat créé — BC, réception/BL, facture.");
    await load();
    router.push(traitementsHref({ type: "achat", id: traitementId }));
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Demandes d'achat"
        description="Articles ou gasoil — validation → traitement achat (BC, BL/réception, facture)."
        exportHref="/api/admin/purchase-requests?format=csv"
        actions={
          <button type="button" className={btnPrimary} onClick={openNewDa}>
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
          { id: "workflow", label: "Workflow" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <PurchaseRequestsPageSkeleton partial /> : null}

      {!loading && tab === "workflow" ? (
        <AdminInventoryCard title="Circuit DA → traitement">
          <ol className="list-decimal space-y-2 px-5 py-4 text-sm text-[var(--graphite)]/90">
            <li>
              <strong>Nouvelle DA</strong> — choisissez <em>Articles</em> ou <em>Gasoil</em> dans la popup.
            </li>
            <li>
              <strong>Soumettre</strong> — document PDF téléchargeable à tout moment.
            </li>
            <li>
              <strong>Approuver</strong> ou rejeter depuis la liste ou en ouvrant le N° de DA.
            </li>
            <li>
              <strong>Créer traitement achat</strong> — BC → BL (articles) ou réception gasoil → Facture.
            </li>
            <li>Le stock se met à jour au BL / réception ; la facture clôt le traitement automatiquement.</li>
          </ol>
        </AdminInventoryCard>
      ) : null}

      {!loading && tab === "list" ? (
        <AdminInventoryCard
          title="Liste des demandes"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="N°, objet, fournisseur…"
          actions={
            <SearchableEnumSelect
              options={statusFilterOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              inputClassName={`${inputClass} max-w-[200px] min-h-[38px] py-2`}
              placeholder="Tous statuts"
            />
          }
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search || statusFilter
                ? "Aucun résultat pour ce filtre."
                : "Aucune demande d'achat enregistrée."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={openNewDa}>
                Nouvelle DA
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="N°" sortKey="number" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Type" sortKey="type" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Objet" sortKey="subject" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Catégorie" sortKey="category" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Montant" sortKey="amount" sort={sort} onSort={onSort} align="right" />
                  <AdminSortableTh label="Statut" sortKey="status" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Traitement" sortKey="traitement" sort={sort} onSort={onSort} />
                  <th className={thClass}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map((r) => {
                  const gasoil = isGasoilPurchaseRequest(r);
                  return (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>
                      <button
                        type="button"
                        className="font-mono text-xs text-[var(--navy)] underline underline-offset-2"
                        onClick={() => setViewRequest(r)}
                      >
                        {r.number}
                      </button>
                    </td>
                    <td className={tdClass}>
                      <span className={`text-xs font-medium ${gasoil ? "text-sky-800" : "text-[var(--graphite)]/75"}`}>
                        {gasoil ? "Gasoil" : "Articles"}
                      </span>
                    </td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={r.subject} />
                    </td>
                    <td className={tdClass}>{PURCHASE_CATEGORY_LABELS[r.category]}</td>
                    <td className={tdClass}>{r.totalAmount.toLocaleString("fr-MA")} MAD</td>
                    <td className={tdClass}>
                      <PurchaseStatusBadge status={r.status} />
                    </td>
                    <td className={tdClass}>
                      {r.traitementId ? (
                        <Link
                          href={traitementsHref({ type: "achat", id: r.traitementId })}
                          className="text-sm text-[var(--navy)] underline underline-offset-2"
                        >
                          Ouvrir
                        </Link>
                      ) : r.status === "approved" ? (
                        <button
                          type="button"
                          className={btnLinkSuccess}
                          disabled={convertingId === r.id}
                          onClick={() => void convertToTraitement(r)}
                        >
                          {convertingId === r.id ? "Création…" : "Créer traitement"}
                        </button>
                      ) : (
                        "—"
                      )}
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
                        <button type="button" className={btnSecondary} onClick={() => setViewRequest(r)}>
                          Voir
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      <PurchaseRequestKindPickerSheet
        open={kindPickerOpen}
        onClose={() => setKindPickerOpen(false)}
        onPick={startCreate}
      />

      <PurchaseRequestSheet
        mode="create"
        daKind={createKind}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projects={projects}
        products={products}
        initial={stockPrefill}
        onCreated={load}
        onSuccess={(m) => toast.success(m)}
        onError={(m) => toast.error(m)}
      />

      <PurchaseRequestSheet
        mode="view"
        open={Boolean(viewRequest)}
        onClose={() => setViewRequest(null)}
        request={viewRequest}
        projects={projects}
        onChanged={load}
        onSuccess={(m) => toast.success(m)}
        onError={(m) => toast.error(m)}
      />

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
