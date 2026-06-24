"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  defaultTemplate,
  DOCUMENT_LABELS,
  isDeliveryNote,
  isSupplierDocument,
  type DevisTemplate,
  type DocumentType,
  type QuoteDraft,
  type Customer,
  type Supplier,
} from "@/components/admin/devis-types";
import { downloadDevisPdf } from "@/components/admin/devis-pdf";
import {
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  labelClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { TraitementDocumentSheetSkeleton } from "@/components/admin/skeletons/pages";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import { computeNextDocumentNumber, yearFromDate } from "@/lib/admin/document-number";
import {
  buildTraitementQuoteDraft,
  traitementDocumentHref,
  traitementStepToDocumentType,
} from "@/lib/admin/traitement-document";
import {
  TRAITEMENT_STEP_LABELS,
  traitementLineTotal,
  type Traitement,
  type TraitementStepKey,
} from "@/lib/admin/traitement-types";
import { DEFAULT_VAT_RATE, formatMoney } from "@/lib/admin/price-ht-ttc";
import {
  enrichQuoteCounterparty,
  resolveDocumentClientNameForTraitement,
} from "@/lib/admin/quote-counterparty";

type QuickSheetProps = {
  open: boolean;
  traitement: Traitement | null;
  stepKey: TraitementStepKey | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
  onFactureSaved?: (traitementId: string, traitementType: Traitement["traitementType"]) => void;
};

export function TraitementDocumentQuickSheet({
  open,
  traitement,
  stepKey,
  onClose,
  onSaved,
  onError,
  onSuccess,
  onFactureSaved,
}: QuickSheetProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [includeCachet, setIncludeCachet] = useState(false);
  const [existingQuoteId, setExistingQuoteId] = useState<string | undefined>();
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | undefined>();
  const [template, setTemplate] = useState<DevisTemplate>(defaultTemplate);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const documentType: DocumentType | null = useMemo(() => {
    if (!traitement || !stepKey) return null;
    return traitementStepToDocumentType(stepKey, traitement.traitementType);
  }, [traitement, stepKey]);

  const partnerLabel = documentType && isSupplierDocument(documentType) ? "Fournisseur" : "Client";
  const totalHt = traitement ? traitementLineTotal(traitement.lines) : 0;
  const isFacture = documentType === "facture";
  const advancedHref =
    traitement && stepKey ? traitementDocumentHref(traitement, stepKey) : null;

  const resetFields = useCallback(() => {
    setQuoteNumber("");
    setDate(new Date().toISOString().slice(0, 10));
    setDueDate("");
    setClientName("");
    setVatRate(DEFAULT_VAT_RATE);
    setIncludeCachet(false);
    setExistingQuoteId(undefined);
    setExistingCreatedAt(undefined);
  }, []);

  useEffect(() => {
    if (!open || !traitement || !stepKey || !documentType) return;

    let mounted = true;
    resetFields();
    setLoading(true);

    async function load() {
      try {
        const [quotesRes, templateRes, suppliersRes, customersRes] = await Promise.all([
          fetch("/api/admin/quotes", { cache: "no-store" }),
          fetch("/api/admin/template", { cache: "no-store" }),
          fetch("/api/admin/suppliers", { cache: "no-store" }),
          fetch("/api/admin/customers", { cache: "no-store" }),
        ]);

        const quotes = quotesRes.ok ? ((await quotesRes.json()) as QuoteDraft[]) : [];
        const loadedSuppliers = suppliersRes.ok ? ((await suppliersRes.json()) as Supplier[]) : [];
        const loadedCustomers = customersRes.ok ? ((await customersRes.json()) as Customer[]) : [];

        if (templateRes.ok) {
          const tpl = (await templateRes.json()) as DevisTemplate;
          if (mounted) setTemplate({ ...defaultTemplate, ...tpl });
        }
        if (mounted) {
          setSuppliers(loadedSuppliers);
          setCustomers(loadedCustomers);
        }

        const step = traitement!.steps[stepKey!];
        const existingId = step?.quoteId?.trim();
        const partnerIds = {
          supplierId: traitement!.supplierId ?? undefined,
          customerId: traitement!.customerId ?? undefined,
        };

        if (existingId) {
          const quoteRes = await fetch(`/api/admin/quotes?id=${encodeURIComponent(existingId)}`, {
            cache: "no-store",
          });
          if (quoteRes.ok && mounted) {
            const quote = (await quoteRes.json()) as QuoteDraft;
            const enriched = enrichQuoteCounterparty(quote, loadedSuppliers, loadedCustomers, partnerIds);
            setExistingQuoteId(quote.id);
            setExistingCreatedAt(quote.createdAt);
            setQuoteNumber(quote.quoteNumber || step?.docNumber || "");
            setDate(quote.date || step?.docDate || new Date().toISOString().slice(0, 10));
            setDueDate(quote.dueDate || "");
            setClientName(enriched.clientName);
            setVatRate(quote.vatRate ?? DEFAULT_VAT_RATE);
            setIncludeCachet(Boolean(quote.includeCachet));
            return;
          }
        }

        if (!mounted) return;
        const docDate = step?.docDate || new Date().toISOString().slice(0, 10);
        setQuoteNumber(
          step?.docNumber?.trim() ||
            computeNextDocumentNumber(quotes, documentType!, yearFromDate(docDate)),
        );
        setDate(docDate);
        setClientName(
          resolveDocumentClientNameForTraitement(traitement!, loadedSuppliers, loadedCustomers),
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [open, traitement, stepKey, documentType, resetFields]);

  useEffect(() => {
    if (!open || existingQuoteId || !documentType || loading) return;
    void (async () => {
      const res = await fetch("/api/admin/quotes", { cache: "no-store" });
      if (!res.ok) return;
      const quotes = (await res.json()) as QuoteDraft[];
      setQuoteNumber(computeNextDocumentNumber(quotes, documentType, yearFromDate(date)));
    })();
  }, [open, date, documentType, existingQuoteId, loading]);

  function buildDraft(): QuoteDraft | null {
    if (!traitement || !stepKey || !documentType) return null;
    if (!quoteNumber.trim()) {
      onError("Indiquez le numéro du document.");
      return null;
    }
    if (!date.trim()) {
      onError("Indiquez la date du document.");
      return null;
    }
    return enrichQuoteCounterparty(
      buildTraitementQuoteDraft(traitement, stepKey, {
        quoteNumber,
        date,
        dueDate: isFacture ? dueDate : undefined,
        clientName,
        clientIce: "",
        reference: "",
        vatRate,
        includeCachet,
        existingQuoteId,
        existingCreatedAt,
      }),
      suppliers,
      customers,
      {
        supplierId: traitement.supplierId ?? undefined,
        customerId: traitement.customerId ?? undefined,
      },
    );
  }

  async function persist(draft: QuoteDraft, downloadAfter: boolean) {
    setSaving(true);
    const res = await fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);

    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }

    const label = DOCUMENT_LABELS[draft.documentType ?? "devis"];
    onSuccess(existingQuoteId ? `${label} mis à jour.` : `${label} enregistré.`);

    if (downloadAfter) {
      await downloadDevisPdf(draft, template);
    }

    await onSaved();

    if (stepKey === "f" && traitement && onFactureSaved) {
      onFactureSaved(traitement.id, traitement.traitementType);
      onClose();
      return;
    }

    onClose();
  }

  async function handleSave(downloadAfter: boolean) {
    const draft = buildDraft();
    if (!draft) return;
    await persist(draft, downloadAfter);
  }

  if (!traitement || !stepKey || !documentType) return null;

  const docLabel = DOCUMENT_LABELS[documentType];
  const stepLabel = TRAITEMENT_STEP_LABELS[stepKey];
  const isEdit = Boolean(existingQuoteId);

  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title={isEdit ? `Modifier ${docLabel.toLowerCase()}` : `Créer ${docLabel.toLowerCase()}`}
      description={`Traitement ${traitement.number} · étape ${stepLabel} · ${traitement.lines.length} article(s) · ${formatMoney(totalHt)} HT`}
      footer={
        <div className="flex w-full flex-wrap items-center gap-2">
          {advancedHref ? (
            <Link href={advancedHref} className={btnSecondary} onClick={onClose}>
              Mode avancé
            </Link>
          ) : null}
          <div className="ml-auto flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
              Annuler
            </button>
            <button
              type="button"
              className={btnSecondary}
              disabled={saving || loading}
              onClick={() => void handleSave(false)}
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={saving || loading}
              onClick={() => void handleSave(true)}
            >
              {saving ? "Enregistrement…" : "Enregistrer et PDF"}
            </button>
          </div>
        </div>
      }
    >
      {loading ? (
        <TraitementDocumentSheetSkeleton />
      ) : (
        <div className={formGridClass}>
          <AdminSheetField
            label="Numéro"
            required
            hint={existingQuoteId ? undefined : "Attribué automatiquement (001, 002, 003…)"}
          >
            <input
              className={`${inputClass} ${existingQuoteId ? "" : "bg-[var(--background)] font-mono"}`}
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              readOnly={!existingQuoteId}
              placeholder={`N° ${docLabel.toLowerCase()}`}
            />
          </AdminSheetField>
          <AdminSheetField label="Date" required>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </AdminSheetField>
          {isFacture ? (
            <AdminSheetField label="Échéance paiement (finance)" className="sm:col-span-2">
              <input
                type="date"
                className={inputClass}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <p className="mt-1 text-xs text-[var(--graphite)]/65">
                Enregistrée automatiquement en finance à la validation de la facture.
              </p>
            </AdminSheetField>
          ) : null}
          <AdminSheetField label={partnerLabel} required className="sm:col-span-2">
            <input
              className={inputClass}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </AdminSheetField>
          {!isDeliveryNote(documentType) ? (
            <AdminSheetField label="TVA (%)" className="sm:col-span-2">
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                className={`${inputClass} max-w-[120px]`}
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value) || 0)}
              />
            </AdminSheetField>
          ) : null}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-[var(--graphite)]/85">
              <input
                type="checkbox"
                checked={includeCachet}
                onChange={(e) => setIncludeCachet(e.target.checked)}
              />
              Inclure cachet / signature sur le PDF
            </label>
          </div>
          <div className="sm:col-span-2 rounded-lg border border-border bg-[var(--background)]/60 px-3 py-2.5 text-sm">
            <p className={labelClass}>Récapitulatif articles</p>
            <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-[var(--graphite)]/85">
              {traitement.lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">
                    {line.reference ? `${line.reference} — ` : ""}
                    {line.designation}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {line.qty} × {formatMoney(line.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-border pt-2 font-medium text-[var(--navy)]">
              Total HT : {formatMoney(totalHt)}
            </p>
          </div>
          <p className="sm:col-span-2 text-xs text-[var(--graphite)]/65">
            Les lignes proviennent du traitement. Utilisez le mode avancé pour modifier le détail, les
            remises ou le pied de page entreprise.
            {stepKey === "bl" ? " Le BL met à jour le stock automatiquement à l'enregistrement." : ""}
          </p>
        </div>
      )}
    </AdminDataSheet>
  );
}
