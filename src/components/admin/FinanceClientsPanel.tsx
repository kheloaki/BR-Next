"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FinanceDocumentOriginCell } from "@/components/admin/FinanceDocumentOriginCell";
import { useFinanceCore } from "@/components/admin/FinanceCaissePanel";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import type { FinanceDocument } from "@/lib/admin/finance-types";
import { FINANCE_DOCUMENT_TYPE_LABELS, FINANCE_PAYMENT_STATUS_LABELS } from "@/lib/admin/finance-types";
import {
  btnPrimary,
  btnSecondary,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { FinanceClientsPanelSkeleton } from "@/components/admin/skeletons/pages";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import { currentAdminPageUrl } from "@/lib/admin/admin-list-form-nav";
import { financeFactureDetailHref } from "@/lib/admin/finance-nav";

export function FinanceClientsPanel({ embedded = false }: { embedded?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentAdminPageUrl(pathname, searchParams);
  const highlightId = searchParams.get("highlight");
  const projectFilter = searchParams.get("projectId");
  const { loading: coreLoading } = useFinanceCore();
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { sort, onSort, applySort } = useTableSort("issueDate");

  const sortAccessors = useMemo(
    () => ({
      documentNumber: (d: FinanceDocument) => d.documentNumber,
      customer: (d: FinanceDocument) => d.customerName ?? "",
      origin: (d: FinanceDocument) => d.sourceLabel ?? d.sourceTraitementType ?? d.sourceType ?? "",
      amountTtc: (d: FinanceDocument) => d.amountTtc,
      paidAmount: (d: FinanceDocument) => d.paidAmount,
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
    const qs = new URLSearchParams({ type: "client_invoice" });
    if (projectFilter) qs.set("projectId", projectFilter);
    const res = await fetch(`/api/admin/finance/documents?${qs.toString()}`, { cache: "no-store" });
    if (res.ok) setDocuments((await res.json()) as FinanceDocument[]);
    setLoading(false);
  }, [projectFilter]);

  useEffect(() => {
    void loadDocs();
  }, [loadDocs]);

  if (loading || coreLoading) return <FinanceClientsPanelSkeleton embedded={embedded} />;

  const content = (
    <>
      <AdminInventoryCard title="Factures clients">
        {documents.length === 0 ? (
          <p className="px-5 py-10 text-sm text-[var(--graphite)]/70">
            Aucune facture enregistrée en finance. Utilisez « Enregistrer en finance » depuis Facturation.
          </p>
        ) : (
          <AdminTableWrap>
            <thead>
              <tr>
                <AdminSortableTh label="N°" sortKey="documentNumber" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Client" sortKey="customer" sort={sort} onSort={onSort} />
                <AdminSortableTh label="Origine" sortKey="origin" sort={sort} onSort={onSort} />
                <AdminSortableTh label="TTC" sortKey="amountTtc" sort={sort} onSort={onSort} align="right" />
                <AdminSortableTh label="Payé" sortKey="paidAmount" sort={sort} onSort={onSort} align="right" />
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
                    <AdminTruncatedText text={d.customerName} lines={1} />
                  </td>
                  <td className={tdClass}>
                    <FinanceDocumentOriginCell document={d} />
                  </td>
                  <td className={tdClass}>{d.amountTtc.toLocaleString("fr-MA")}</td>
                  <td className={tdClass}>{d.paidAmount.toLocaleString("fr-MA")}</td>
                  <td className={tdClass}>{d.remainingAmount.toLocaleString("fr-MA")}</td>
                  <td className={tdClass}>{FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus]}</td>
                  <td className={tdClass}>
                    <div className="flex flex-wrap gap-1">
                      {d.remainingAmount > 0 ? (
                        <Link href={financeFactureDetailHref(d.id, { encaisser: true, returnTo })} className={btnPrimary}>
                          Encaisser
                        </Link>
                      ) : null}
                      <Link href={financeFactureDetailHref(d.id, { returnTo })} className={btnSecondary}>
                        Ouvrir
                      </Link>
                      {d.customerId ? (
                        <Link href={`/admin/finance/clients/${d.customerId}`} className={btnSecondary}>
                          Fiche client
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminInventoryCard>
    </>
  );

  if (embedded) return content;

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Factures clients"
        description="Factures enregistrées, encaissements et impayés."
        exportHref="/api/admin/finance/reports?kind=balance_clients&format=csv"
      />
      {content}
    </div>
  );
}

export function FinanceClientDetailPanel({ customerId }: { customerId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = currentAdminPageUrl(pathname, searchParams);
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [customerName, setCustomerName] = useState("");
  const { sort, onSort, applySort } = useTableSort("issueDate");

  const sortAccessors = useMemo(
    () => ({
      documentNumber: (d: FinanceDocument) => d.documentNumber,
      documentType: (d: FinanceDocument) => FINANCE_DOCUMENT_TYPE_LABELS[d.documentType],
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

  useEffect(() => {
    void (async () => {
      const [docRes, custRes] = await Promise.all([
        fetch(`/api/admin/finance/documents?customerId=${encodeURIComponent(customerId)}`, { cache: "no-store" }),
        fetch("/api/admin/customers", { cache: "no-store" }),
      ]);
      if (docRes.ok) setDocuments((await docRes.json()) as FinanceDocument[]);
      if (custRes.ok) {
        const list = (await custRes.json()) as { id: string; name: string }[];
        setCustomerName(list.find((c) => c.id === customerId)?.name ?? "");
      }
    })();
  }, [customerId]);

  const remaining = documents.reduce((s, d) => s + d.remainingAmount, 0);

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader title={`Fiche finance — ${customerName || customerId}`} description="Solde et historique client." />
      <p className="text-sm mb-4">Solde client : <strong>{remaining.toLocaleString("fr-MA")} MAD</strong></p>
      <AdminTableWrap>
        <thead>
          <tr>
            <AdminSortableTh label="N°" sortKey="documentNumber" sort={sort} onSort={onSort} />
            <AdminSortableTh label="Type" sortKey="documentType" sort={sort} onSort={onSort} />
            <AdminSortableTh label="TTC" sortKey="amountTtc" sort={sort} onSort={onSort} align="right" />
            <AdminSortableTh label="Reste" sortKey="remainingAmount" sort={sort} onSort={onSort} align="right" />
            <AdminSortableTh label="Statut" sortKey="paymentStatus" sort={sort} onSort={onSort} />
            <th className={thClass} />
          </tr>
        </thead>
        <tbody>
          {sortedDocuments.map((d) => (
            <tr key={d.id} className={rowHover}>
              <td className={tdClass}>
                <Link
                  href={financeFactureDetailHref(d.id, { returnTo })}
                  className="font-medium text-[var(--navy)] hover:underline"
                >
                  {d.documentNumber}
                </Link>
              </td>
              <td className={tdClass}>{FINANCE_DOCUMENT_TYPE_LABELS[d.documentType]}</td>
              <td className={tdClass}>{d.amountTtc.toLocaleString("fr-MA")}</td>
              <td className={tdClass}>{d.remainingAmount.toLocaleString("fr-MA")}</td>
              <td className={tdClass}>{FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus]}</td>
              <td className={tdClass}>
                <div className="flex flex-wrap gap-1">
                  {d.remainingAmount > 0 ? (
                    <Link href={financeFactureDetailHref(d.id, { encaisser: true, returnTo })} className={btnPrimary}>
                      Encaisser
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
    </div>
  );
}
