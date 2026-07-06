"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FinanceDocumentOriginCell } from "@/components/admin/FinanceDocumentOriginCell";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { withEmptyOption, idNameOptions } from "@/components/admin/searchable-options";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceDocument } from "@/lib/admin/finance-types";
import { FINANCE_PAYMENT_STATUS_LABELS } from "@/lib/admin/finance-types";
import {
  btnPrimary,
  btnSecondary,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { FinanceSuppliersPanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import { currentAdminPageUrl } from "@/lib/admin/admin-list-form-nav";
import { financeFactureDetailHref } from "@/lib/admin/finance-nav";

export function FinanceSuppliersPanel({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentAdminPageUrl(pathname, searchParams);
  const highlightId = searchParams.get("highlight");
  const projectFilter = searchParams.get("projectId");
  const toast = useAdminToast();
  const { loading: coreLoading } = useFinanceCore();
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [amountTtc, setAmountTtc] = useState(0);
  const [docNumber, setDocNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const { sort, onSort, applySort } = useTableSort("issueDate");

  const sortAccessors = useMemo(
    () => ({
      documentNumber: (d: FinanceDocument) => d.documentNumber,
      supplier: (d: FinanceDocument) => d.supplierName ?? "",
      origin: (d: FinanceDocument) => d.sourceLabel ?? d.sourceTraitementType ?? d.sourceType ?? "",
      amountTtc: (d: FinanceDocument) => d.amountTtc,
      remainingAmount: (d: FinanceDocument) => d.remainingAmount,
      paymentStatus: (d: FinanceDocument) => FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus],
      issueDate: (d: FinanceDocument) => d.issueDate,
    }),
    [],
  );

  const sortedDocuments = useMemo(
    () => applySort(documents, sortAccessors),
    [documents, sortAccessors, applySort],
  );

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ type: "supplier_invoice" });
    if (projectFilter) qs.set("projectId", projectFilter);
    const res = await fetch(`/api/admin/finance/documents?${qs.toString()}`, { cache: "no-store" });
    if (res.ok) setDocuments((await res.json()) as FinanceDocument[]);
    setLoading(false);
  }, [projectFilter]);

  useEffect(() => {
    void loadDocs();
    void fetch("/api/admin/suppliers", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSuppliers(d as { id: string; name: string }[]));
  }, [loadDocs]);

  const supplierOptions = useMemo(
    () => withEmptyOption(idNameOptions(suppliers), "Fournisseur…"),
    [suppliers],
  );

  async function createSupplierInvoice() {
    const res = await fetch("/api/admin/finance/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        documentType: "supplier_invoice",
        supplierId,
        documentNumber: docNumber,
        amountTtc,
        amountHt: amountTtc,
        dueDate: dueDate || null,
      }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Facture fournisseur enregistrée.");
    setShowCreate(false);
    await loadDocs();
  }

  if (loading || coreLoading) return <FinanceSuppliersPanelSkeleton embedded={embedded} />;

  const content = (
    <>
      <button type="button" className={`${btnSecondary} mb-4`} onClick={() => setShowCreate(true)}>
        + Facture fournisseur
      </button>

      <AdminInventoryCard title="Factures fournisseurs">
        <AdminTableWrap>
          <thead>
            <tr>
              <AdminSortableTh label="N°" sortKey="documentNumber" sort={sort} onSort={onSort} />
              <AdminSortableTh label="Fournisseur" sortKey="supplier" sort={sort} onSort={onSort} />
              <AdminSortableTh label="Origine" sortKey="origin" sort={sort} onSort={onSort} />
              <AdminSortableTh label="TTC" sortKey="amountTtc" sort={sort} onSort={onSort} align="right" />
              <AdminSortableTh label="Reste" sortKey="remainingAmount" sort={sort} onSort={onSort} align="right" />
              <AdminSortableTh label="Statut" sortKey="paymentStatus" sort={sort} onSort={onSort} />
              <th className={thClass} />
            </tr>
          </thead>
          <tbody>
            {sortedDocuments.map((d) => (
              <tr
                key={d.id}
                className={`${rowHover}${highlightId === d.id ? " bg-amber-50 ring-1 ring-inset ring-amber-200" : ""}`}
              >
                <td className={tdClass}>
                  <Link
                    href={financeFactureDetailHref(d.id, { returnTo })}
                    className="font-medium text-[var(--navy)] hover:underline"
                  >
                    {d.documentNumber}
                  </Link>
                </td>
                <td className={tdClass}>
                  <AdminTruncatedText text={d.supplierName} lines={1} />
                </td>
                <td className={tdClass}>
                  <FinanceDocumentOriginCell document={d} />
                </td>
                <td className={tdClass}>{d.amountTtc.toLocaleString("fr-MA")}</td>
                <td className={tdClass}>{d.remainingAmount.toLocaleString("fr-MA")}</td>
                <td className={tdClass}>{FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus]}</td>
                <td className={tdClass}>
                  <div className="flex flex-wrap gap-1">
                    {d.remainingAmount > 0 ? (
                      <Link href={financeFactureDetailHref(d.id, { payer: true, returnTo })} className={btnPrimary}>
                        Payer
                      </Link>
                    ) : null}
                    <Link href={financeFactureDetailHref(d.id, { returnTo })} className={btnSecondary}>
                      Ouvrir
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTableWrap>
      </AdminInventoryCard>

      {showCreate ? (
        <AdminFormCard
          title="Nouvelle facture fournisseur"
          footer={<button type="button" className={btnPrimary} onClick={() => void createSupplierInvoice()}>Enregistrer</button>}
        >
          <div className="mb-2">
            <SearchableSelect
              options={supplierOptions}
              value={supplierId}
              onChange={setSupplierId}
              placeholder="Fournisseur…"
              inputClassName={inputClass}
            />
          </div>
          <input className={`${inputClass} mb-2`} placeholder="N° facture" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
          <input type="number" className={`${inputClass} mb-2`} placeholder="Montant TTC" value={amountTtc || ""} onChange={(e) => setAmountTtc(Number(e.target.value) || 0)} />
          <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </AdminFormCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </>
  );

  if (embedded) return content;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Factures fournisseurs"
        description="Dettes fournisseurs et décaissements."
        exportHref="/api/admin/finance/reports?kind=balance_fournisseurs"
      />
      {content}
    </div>
  );
}
