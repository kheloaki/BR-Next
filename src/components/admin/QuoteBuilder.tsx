"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DocumentPreview } from "@/components/admin/DocumentPreview";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { ProductCategorySelect } from "@/components/admin/ProductCategorySelect";
import { ProductUnitField } from "@/components/admin/ProductUnitField";
import { DEFAULT_VAT_RATE, formatMoney, htToTtc } from "@/lib/admin/price-ht-ttc";
import { downloadDevisPdf } from "@/components/admin/devis-pdf";
import {
  DOCUMENT_LABELS,
  isDeliveryNote,
  isSupplierDocument,
  type Customer,
  defaultTemplate,
  type DevisTemplate,
  type DocumentType,
  type Product,
  type ProductCategory,
  type QuoteDraft,
  type LineItem,
  PRODUCT_UNITS,
  type Supplier,
} from "@/components/admin/devis-types";
import { btnDanger, inputClass, inputClassDense, moduleWrap } from "@/components/admin/admin-form-styles";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";
import { buildBonLivraisonFromFacture } from "@/lib/admin/bon-livraison";
import {
  facturationBonLivraisonFromFacturePath,
  facturationBuilderPath,
  facturationDocumentsPath,
  facturationEditPath,
} from "@/lib/admin/facturation-nav";
import {
  buildQuoteDraftFromTraitement,
  traitementDocumentBuilderPath,
  traitementReturnPath,
  traitementStepToDocumentType,
} from "@/lib/admin/traitement-document";
import type { Traitement } from "@/lib/admin/traitement-types";
import { TRAITEMENT_STEP_LABELS, type TraitementStepKey, type TraitementType } from "@/lib/admin/traitement-types";

function money(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function computeNextNumber(quotes: QuoteDraft[], type: DocumentType): string {
  const sameType = quotes.filter((q) => (q.documentType ?? "devis") === type);
  if (sameType.length === 0) {
    return `001/${new Date().getFullYear()}`;
  }
  let maxNum = 0;
  let templateStr = sameType[0].quoteNumber || "";
  for (const q of sameType) {
    const numberMatch = (q.quoteNumber || "").match(/\d+/);
    if (numberMatch) {
      const n = parseInt(numberMatch[0], 10);
      if (n > maxNum) {
        maxNum = n;
        templateStr = q.quoteNumber || "";
      }
    }
  }
  const next = maxNum + 1;
  const formatMatch = templateStr.match(/^(\D*)(\d+)(.*)$/);
  if (!formatMatch) return String(next);
  const [, prefix, digits, suffix] = formatMatch;
  const padded = String(next).padStart(digits.length, "0");
  const currentYear = String(new Date().getFullYear());
  const updatedSuffix = suffix.replace(/(19|20)\d{2}/, currentYear);
  return `${prefix}${padded}${updatedSuffix}`;
}

function NumberField({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number;
  onChange: (next: number) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder ?? "0"}
      value={value === 0 ? "" : String(value)}
      onChange={(event) => {
        const cleaned = event.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
        if (cleaned === "") {
          onChange(0);
          return;
        }
        const parsed = Number(cleaned);
        onChange(Number.isFinite(parsed) ? parsed : 0);
      }}
    />
  );
}

export function QuoteBuilder({ fixedDocumentType }: { fixedDocumentType?: DocumentType } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");
  const fromFactureId = searchParams.get("fromFacture");
  const traitementIdParam = searchParams.get("traitementId");
  const traitementStepParam = searchParams.get("step") as TraitementStepKey | null;
  const traitementTypeParam = searchParams.get("traitementType") as TraitementType | null;

  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [pickerCategory, setPickerCategory] = useState("");
  const [template, setTemplate] = useState<DevisTemplate>(defaultTemplate);
  const [savedCount, setSavedCount] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProductReference, setNewProductReference] = useState("");
  const [newProductDesignation, setNewProductDesignation] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("u");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductCategory, setNewProductCategory] = useState("");
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newSupplierRib, setNewSupplierRib] = useState("");
  const [newSupplierBankName, setNewSupplierBankName] = useState("");
  const [newCustomerIce, setNewCustomerIce] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [counterpartyMode, setCounterpartyMode] = useState<"saved" | "passager">("saved");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState("");

  const [documentType, setDocumentType] = useState<DocumentType>("devis");
  const [includeCachet, setIncludeCachet] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [linkedFactureId, setLinkedFactureId] = useState<string | undefined>();
  const [linkedFactureNumber, setLinkedFactureNumber] = useState<string | undefined>();
  const autoNumberInitRef = useRef(false);
  const prevDocTypeRef = useRef<DocumentType>("devis");
  const [items, setItems] = useState<LineItem[]>([]);
  const [allQuotes, setAllQuotes] = useState<QuoteDraft[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [traitementLink, setTraitementLink] = useState<{
    id: string;
    number: string;
    step: TraitementStepKey;
    type: TraitementType;
    projectId?: string | null;
  } | null>(null);
  const traitementPrefillRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [productsRes, categoriesRes, templateRes, quotesRes, customersRes, suppliersRes] =
          await Promise.all([
            fetch("/api/admin/products", { cache: "no-store" }),
            fetch("/api/admin/product-categories", { cache: "no-store" }),
            fetch("/api/admin/template", { cache: "no-store" }),
            fetch("/api/admin/quotes", { cache: "no-store" }),
            fetch("/api/admin/customers", { cache: "no-store" }),
            fetch("/api/admin/suppliers", { cache: "no-store" }),
          ]);
        if (!mounted) return;

        if (productsRes.ok) {
          setProducts((await productsRes.json()) as Product[]);
        }
        if (categoriesRes.ok) {
          setProductCategories((await categoriesRes.json()) as ProductCategory[]);
        }
        if (templateRes.ok) {
          setTemplate((await templateRes.json()) as DevisTemplate);
        }
        if (quotesRes.ok) {
          const quotes = (await quotesRes.json()) as QuoteDraft[];
          setAllQuotes(quotes);
          setSavedCount(quotes.length);
        }
        if (customersRes.ok) {
          setCustomers((await customersRes.json()) as Customer[]);
        }
        if (suppliersRes.ok) {
          setSuppliers((await suppliersRes.json()) as Supplier[]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setDataLoaded(true);
        }
      }
    }

    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!editingId) return;
    let mounted = true;
    async function loadQuote() {
      const res = await fetch(`/api/admin/quotes?id=${encodeURIComponent(editingId!)}`, {
        cache: "no-store",
      });
      if (!res.ok || !mounted) return;
      const draft = (await res.json()) as QuoteDraft;
      setDocumentType(draft.documentType ?? "devis");
      setIncludeCachet(Boolean(draft.includeCachet));
      setClientName(draft.clientName ?? "");
      setClientIce(draft.clientIce ?? "");
      setClientAddress(draft.clientAddress ?? "");
      setQuoteNumber(draft.quoteNumber ?? "");
      setReference(draft.reference ?? "");
      setDate(draft.date ?? new Date().toISOString().slice(0, 10));
      setDueDate(draft.dueDate ?? "");
      setVatRate(typeof draft.vatRate === "number" ? draft.vatRate : DEFAULT_VAT_RATE);
      setDiscount(typeof draft.discount === "number" ? draft.discount : 0);
      setDeposit(typeof draft.deposit === "number" ? draft.deposit : 0);
      setItems(Array.isArray(draft.items) ? draft.items : []);
      if (draft.traitementId && draft.traitementStep && draft.traitementType) {
        setTraitementLink({
          id: draft.traitementId,
          number: draft.traitementNumber ?? "",
          step: draft.traitementStep,
          type: draft.traitementType,
        });
      }
    }
    void loadQuote();
    return () => {
      mounted = false;
    };
  }, [editingId]);

  useEffect(() => {
    if (editingId || fixedDocumentType) return;
    const typeParam = searchParams.get("type");
    if (
      typeParam === "devis" ||
      typeParam === "bon_commande" ||
      typeParam === "facture" ||
      typeParam === "bon_livraison"
    ) {
      setDocumentType(typeParam);
    }
  }, [editingId, fixedDocumentType, searchParams]);

  useEffect(() => {
    if (editingId || !fixedDocumentType) return;
    setDocumentType(fixedDocumentType);
  }, [editingId, fixedDocumentType]);

  useEffect(() => {
    if (editingId || !fromFactureId || !dataLoaded) return;
    const facture = allQuotes.find((q) => q.id === fromFactureId);
    if (!facture || (facture.documentType ?? "devis") !== "facture") return;
    const draft = buildBonLivraisonFromFacture(facture, allQuotes);
    setDocumentType("bon_livraison");
    setClientName(draft.clientName ?? "");
    setClientIce(draft.clientIce ?? "");
    setClientAddress(draft.clientAddress ?? "");
    setQuoteNumber(draft.quoteNumber ?? "");
    setReference(draft.reference ?? "");
    setDate(draft.date ?? new Date().toISOString().slice(0, 10));
    setDueDate("");
    setVatRate(draft.vatRate ?? DEFAULT_VAT_RATE);
    setDiscount(0);
    setDeposit(0);
    setItems(draft.items ?? []);
    setIncludeCachet(Boolean(draft.includeCachet));
    setLinkedFactureId(draft.linkedFactureId);
    setLinkedFactureNumber(draft.linkedFactureNumber);
    autoNumberInitRef.current = true;
  }, [editingId, fromFactureId, dataLoaded, allQuotes]);

  useEffect(() => {
    if (editingId || !traitementIdParam || !traitementStepParam || !traitementTypeParam) return;
    if (!dataLoaded || traitementPrefillRef.current) return;

    let mounted = true;
    async function loadTraitementPrefill() {
      const res = await fetch(`/api/admin/traitements?id=${encodeURIComponent(traitementIdParam!)}`, {
        cache: "no-store",
      });
      if (!res.ok || !mounted) return;
      const traitement = (await res.json()) as Traitement;
      const step = traitementStepParam!;
      const existing = traitement.steps[step];
      if (existing?.quoteId) {
        const docType = traitementStepToDocumentType(step, traitement.traitementType);
        if (docType) {
          router.replace(facturationEditPath({ id: existing.quoteId, documentType: docType }));
        }
        return;
      }

      const expectedDocType = traitementStepToDocumentType(step, traitement.traitementType);
      if (!expectedDocType) return;
      if (fixedDocumentType && fixedDocumentType !== expectedDocType) {
        router.replace(traitementDocumentBuilderPath(traitement.traitementType, step, traitement.id) ?? traitementReturnPath(traitement.traitementType, traitement.id));
        return;
      }

      const draft = buildQuoteDraftFromTraitement(
        traitement,
        step,
        expectedDocType,
        computeNextNumber(allQuotes, expectedDocType),
      );

      setDocumentType(expectedDocType);
      setClientName(draft.clientName ?? traitement.partnerName);
      setReference(draft.reference ?? traitement.label);
      setQuoteNumber(draft.quoteNumber ?? computeNextNumber(allQuotes, expectedDocType));
      setDate(draft.date ?? new Date().toISOString().slice(0, 10));
      setItems(draft.items ?? []);
      setLinkedFactureId(draft.linkedFactureId);
      setLinkedFactureNumber(draft.linkedFactureNumber);
      if (traitement.supplierId) setSelectedSupplierId(traitement.supplierId);
      if (traitement.customerId) setSelectedCustomerId(traitement.customerId);
      setTraitementLink({
        id: traitement.id,
        number: traitement.number,
        step,
        type: traitement.traitementType,
        projectId: traitement.projectId,
      });
      traitementPrefillRef.current = true;
      autoNumberInitRef.current = true;
    }

    void loadTraitementPrefill();
    return () => {
      mounted = false;
    };
  }, [
    editingId,
    traitementIdParam,
    traitementStepParam,
    traitementTypeParam,
    dataLoaded,
    allQuotes,
    fixedDocumentType,
    router,
  ]);

  useEffect(() => {
    if (loading) return;
    const timeout = setTimeout(() => {
      void fetch("/api/admin/template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
    }, 300);
    return () => clearTimeout(timeout);
  }, [template]);

  useEffect(() => {
    setSelectedCustomerId("");
    setSelectedSupplierId("");
  }, [documentType]);

  useEffect(() => {
    if (editingId) return;
    if (!dataLoaded) return;
    const isFirstInit = !autoNumberInitRef.current;
    const docTypeChanged = prevDocTypeRef.current !== documentType;
    if (isFirstInit || docTypeChanged) {
      setQuoteNumber(computeNextNumber(allQuotes, documentType));
      autoNumberInitRef.current = true;
      prevDocTypeRef.current = documentType;
    }
  }, [dataLoaded, documentType, editingId, allQuotes]);

  const totals = useMemo(() => {
    const totalHt = items.reduce(
      (acc, item) => (item.isNote ? acc : acc + item.qty * item.unitPrice),
      0,
    );
    const netHt = Math.max(0, totalHt - discount);
    const vatAmount = (netHt * vatRate) / 100;
    const totalTtc = netHt + vatAmount;
    const netToPay = Math.max(0, totalTtc - deposit);
    return { totalHt, netHt, vatAmount, totalTtc, netToPay };
  }, [items, vatRate, discount, deposit]);

  const pickerProducts = useMemo(() => {
    if (!pickerCategory) return products;
    return products.filter((p) => p.category === pickerCategory);
  }, [products, pickerCategory]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItemFromProduct(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => [
      ...prev,
      {
        productId: p.id,
        reference: p.reference,
        designation: p.designation,
        unit: p.unit || "u",
        qty: 1,
        unitPrice: p.unitPrice,
      },
    ]);
  }

  async function removeItem(index: number) {
    const item = items[index];
    const label = item?.designation?.trim() || "cette ligne";
    if (
      !(await confirmDelete(label, {
        title: "Retirer la ligne",
        description: `Voulez-vous vraiment retirer « ${label} » de ce document ?`,
        confirmLabel: "Retirer",
      }))
    ) {
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addEmptyItem() {
    setItems((prev) => [
      ...prev,
      {
        productId: uid("manual"),
        reference: "NN",
        designation: "",
        unit: "u",
        qty: 1,
        unitPrice: 0,
      },
    ]);
  }

  async function createProductFromBuilder() {
    if (!newProductDesignation.trim()) return;
    if (!newProductUnit.trim()) return;
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: newProductReference.trim() || "NN",
        designation: newProductDesignation.trim(),
        category: newProductCategory,
        unit: newProductUnit.trim(),
        unitPrice: newProductPrice,
      }),
    });
    if (!res.ok) return;
    const created = (await res.json()) as Product;
    const refreshed = await fetch("/api/admin/products", { cache: "no-store" });
    if (refreshed.ok) {
      setProducts((await refreshed.json()) as Product[]);
    }
    setItems((prev) => [
      ...prev,
      {
        productId: created.id,
        reference: created.reference,
        designation: created.designation,
        unit: created.unit || "u",
        qty: 1,
        unitPrice: created.unitPrice,
      },
    ]);
    setNewProductReference("");
    setNewProductDesignation("");
    setNewProductUnit("u");
    setNewProductPrice(0);
    setNewProductCategory("");
    setProductModalOpen(false);
  }

  function addNoteItem() {
    setItems((prev) => [
      ...prev,
      {
        productId: uid("note"),
        reference: "",
        designation: "Mode de paiement: 5 jours apres chaque fin de mois",
        qty: 0,
        unitPrice: 0,
        isNote: true,
      },
    ]);
  }

  const isPurchaseOrder = isSupplierDocument(documentType);
  const counterpartyLabel = isPurchaseOrder ? "fournisseur" : "client";
  const counterpartyApi = isPurchaseOrder ? "/api/admin/suppliers" : "/api/admin/customers";

  function onSelectCounterparty(id: string) {
    if (isPurchaseOrder) {
      setSelectedSupplierId(id);
      const s = suppliers.find((x) => x.id === id);
      if (!s) return;
      setClientName(s.name);
      setClientIce(s.ice);
      setClientAddress([s.address, s.city].filter(Boolean).join(" - "));
    } else {
      setSelectedCustomerId(id);
      const c = customers.find((x) => x.id === id);
      if (!c) return;
      setClientName(c.name);
      setClientIce(c.ice);
      setClientAddress([c.address, c.city].filter(Boolean).join(" - "));
    }
  }

  function activatePassager() {
    setCounterpartyMode("passager");
    setSelectedCustomerId("");
    setSelectedSupplierId("");
    setClientName("");
    setClientIce("");
    setClientAddress("");
  }

  function backToSaved() {
    setCounterpartyMode("saved");
  }

  async function createCounterpartyFromBuilder() {
    if (isPurchaseOrder) {
      if (!newSupplierName.trim() && !newCompanyName.trim()) return;
    } else if (!newCustomerName.trim()) {
      return;
    }
    const res = await fetch(counterpartyApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isPurchaseOrder
          ? {
              supplierName: newSupplierName.trim(),
              companyName: newCompanyName.trim(),
              ice: newCustomerIce.trim(),
              address: newCustomerAddress.trim(),
              rib: newSupplierRib.trim(),
              bankName: newSupplierBankName.trim(),
            }
          : {
              name: newCustomerName.trim(),
              ice: newCustomerIce.trim(),
              address: newCustomerAddress.trim(),
            },
      ),
    });
    if (!res.ok) return;
    const created = (await res.json()) as Customer | Supplier;
    const listRes = await fetch(counterpartyApi, { cache: "no-store" });
    if (listRes.ok) {
      if (isPurchaseOrder) {
        setSuppliers((await listRes.json()) as Supplier[]);
        setSelectedSupplierId(created.id);
      } else {
        setCustomers((await listRes.json()) as Customer[]);
        setSelectedCustomerId(created.id);
      }
    }
    setClientName(created.name);
    setClientIce(created.ice);
    setClientAddress(newCustomerAddress.trim());
    setCounterpartyMode("saved");
    setNewCustomerName("");
    setNewSupplierName("");
    setNewCompanyName("");
    setNewSupplierRib("");
    setNewSupplierBankName("");
    setNewCustomerIce("");
    setNewCustomerAddress("");
    setCustomerPickerOpen(false);
  }

  function currentDraft(): QuoteDraft {
    return {
      id: editingId ?? uid("qte"),
      createdAt: new Date().toISOString(),
      documentType,
      clientName,
      clientIce,
      clientAddress,
      quoteNumber,
      reference,
      date,
      dueDate: documentType === "facture" && dueDate ? dueDate : undefined,
      linkedFactureId: documentType === "bon_livraison" ? linkedFactureId : undefined,
      linkedFactureNumber: documentType === "bon_livraison" ? linkedFactureNumber : undefined,
      vatRate,
      discount: isDeliveryNote(documentType) ? 0 : discount,
      deposit: isDeliveryNote(documentType) ? 0 : deposit,
      items,
      includeCachet,
      traitementId: traitementLink?.id ?? traitementIdParam ?? undefined,
      traitementStep: traitementLink?.step ?? traitementStepParam ?? undefined,
      traitementType: traitementLink?.type ?? traitementTypeParam ?? undefined,
      traitementNumber: traitementLink?.number,
      projectId: traitementLink?.projectId ?? undefined,
    };
  }

  const documentLabel = DOCUMENT_LABELS[documentType];

  function saveDraft() {
    const draft = currentDraft();
    setSaveStatus("saving");
    setSaveErrorMessage("");
    void fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).then(async (res) => {
      if (!res.ok) {
        setSaveStatus("error");
        setSaveErrorMessage(await readApiError(res));
        return;
      }
      const result = (await res.json()) as { id?: string; created?: boolean };
      const quotesRes = await fetch("/api/admin/quotes", { cache: "no-store" });
      if (quotesRes.ok) {
        const quotes = (await quotesRes.json()) as QuoteDraft[];
        setAllQuotes(quotes);
        setSavedCount(quotes.length);
      }
      const savedId = result.id ?? editingId;
      const returnPath =
        traitementLink || traitementIdParam
          ? traitementReturnPath(
              traitementLink?.type ?? traitementTypeParam ?? "achat",
              traitementLink?.id ?? traitementIdParam!,
            )
          : null;

      if (returnPath && result.created) {
        router.push(returnPath);
        return;
      }
      if (!editingId && savedId) {
        router.replace(`${facturationBuilderPath(documentType)}?id=${encodeURIComponent(savedId)}`);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    });
  }

  async function downloadPdf() {
    await downloadDevisPdf(currentDraft(), template);
  }

  return (
    <div className={moduleWrap}>
      {traitementLink ? (
        <div className="mb-4 rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-3 text-sm text-[var(--navy)]">
          Traitement <span className="font-mono font-semibold">{traitementLink.number}</span> — étape{" "}
          <span className="font-semibold">{TRAITEMENT_STEP_LABELS[traitementLink.step]}</span>. Enregistrer met à jour
          le suivi et le stock si applicable (BL / BR).
          <Link
            href={traitementReturnPath(traitementLink.type, traitementLink.id)}
            className="ml-2 font-medium underline underline-offset-2"
          >
            Retour traitement
          </Link>
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-3xl font-semibold text-[var(--navy)]">
            {editingId ? `Modifier ${documentLabel.toLowerCase()}` : `Creer un ${documentLabel.toLowerCase()}`}
          </h2>
          {editingId ? (
            <p className="text-xs text-[var(--graphite)]/70 mt-1">
              En modification — toute sauvegarde mettra à jour ce document.
            </p>
          ) : null}
        </div>
        {!fixedDocumentType ? (
          <div className="inline-flex rounded-md border border-border bg-white p-1 text-sm">
            <button
              type="button"
              onClick={() => setDocumentType("devis")}
              className={`rounded-md px-3 py-1.5 transition ${
                documentType === "devis"
                  ? "bg-[#de7a3a] text-white"
                  : "text-[var(--graphite)]/80 hover:bg-[#f7f7f7]"
              }`}
            >
              Devis
            </button>
            <button
              type="button"
              onClick={() => setDocumentType("bon_commande")}
              className={`rounded-md px-3 py-1.5 transition ${
                documentType === "bon_commande"
                  ? "bg-[#de7a3a] text-white"
                  : "text-[var(--graphite)]/80 hover:bg-[#f7f7f7]"
              }`}
            >
              Bon de commande
            </button>
            <button
              type="button"
              onClick={() => setDocumentType("facture")}
              className={`rounded-md px-3 py-1.5 transition ${
                documentType === "facture"
                  ? "bg-[#de7a3a] text-white"
                  : "text-[var(--graphite)]/80 hover:bg-[#f7f7f7]"
              }`}
            >
              Facture
            </button>
            <button
              type="button"
              onClick={() => setDocumentType("bon_livraison")}
              className={`rounded-md px-3 py-1.5 transition ${
                documentType === "bon_livraison"
                  ? "bg-[#de7a3a] text-white"
                  : "text-[var(--graphite)]/80 hover:bg-[#f7f7f7]"
              }`}
            >
              Bon de livraison
            </button>
          </div>
        ) : null}
      </div>

      {documentType === "bon_livraison" && linkedFactureNumber ? (
        <p className="mb-4 rounded-lg border border-sky-200/80 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">
          Lié à la facture <strong>N° {linkedFactureNumber}</strong>
          {linkedFactureId ? (
            <>
              {" "}
              ·{" "}
              <Link
                href={facturationEditPath({ id: linkedFactureId, documentType: "facture" })}
                className="font-medium underline underline-offset-2"
              >
                Voir la facture
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="grid xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-8">
          <div className="rounded-md border border-border bg-white p-4 lg:p-5">
            <h3 className="text-2xl font-semibold text-[var(--navy)]">Entete</h3>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <input className={inputClass} value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} placeholder={`Numero ${documentLabel.toLowerCase()} (ex: 001/2026)`} />
              <input className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference (ex: N38)" />
              <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
              {documentType === "facture" ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-[0.08em] text-[var(--graphite)]/70">
                    Date d&apos;échéance
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              ) : (
                <div className="hidden md:block" aria-hidden />
              )}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-[0.08em] text-[var(--graphite)]/70">
                  Taux de TVA
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 7, 10, 14, 20].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setVatRate(rate)}
                      className={`rounded-md border px-2.5 py-1 text-sm transition ${
                        vatRate === rate
                          ? "border-[#de7a3a] bg-[#de7a3a] text-white"
                          : "border-border bg-white hover:bg-[#f7f7f7]"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                  <NumberField
                    className={`w-20 ${inputClassDense}`}
                    value={vatRate}
                    onChange={setVatRate}
                    placeholder="Autre"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-md border border-border bg-white p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/70">De</p>
              <input className={`mt-3 w-full ${inputClass}`} value={template.sellerName} onChange={(e) => setTemplate((t) => ({ ...t, sellerName: e.target.value }))} placeholder="Nom entreprise" />
              <input className={`mt-3 w-full ${inputClass}`} value={template.sellerActivity} onChange={(e) => setTemplate((t) => ({ ...t, sellerActivity: e.target.value }))} placeholder="Activite entreprise" />
            </div>
            <div className="rounded-md border border-border bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/70">
                    {isPurchaseOrder ? "Fournisseur" : "Facturer à"}
                  </p>
                  {counterpartyMode === "passager" ? (
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[#b04a09] mt-1">
                      Mode passager — non enregistré
                    </p>
                  ) : null}
                </div>
                <div className="inline-flex rounded-md border border-border bg-white p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={backToSaved}
                    className={`rounded-md px-2 py-1 transition ${
                      counterpartyMode === "saved"
                        ? "bg-[#de7a3a] text-white"
                        : "text-[var(--graphite)]/80 hover:bg-[#f7f7f7]"
                    }`}
                  >
                    Enregistré
                  </button>
                  <button
                    type="button"
                    onClick={activatePassager}
                    className={`rounded-md px-2 py-1 transition ${
                      counterpartyMode === "passager"
                        ? "bg-[#de7a3a] text-white"
                        : "text-[var(--graphite)]/80 hover:bg-[#f7f7f7]"
                    }`}
                  >
                    Passager
                  </button>
                </div>
              </div>

              {counterpartyMode === "saved" ? (
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <select
                    className={inputClass}
                    value={isPurchaseOrder ? selectedSupplierId : selectedCustomerId}
                    onChange={(e) => onSelectCounterparty(e.target.value)}
                  >
                    <option value="">
                      {isPurchaseOrder ? "Sélectionner un fournisseur" : "Sélectionner un client"}
                    </option>
                    {(isPurchaseOrder ? suppliers : customers).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.ice || "Sans ICE"})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setCustomerPickerOpen(true)}
                    className="rounded-md border border-border px-3 text-sm hover:bg-[#f7f7f7]"
                  >
                    + Nouveau
                  </button>
                </div>
              ) : null}
              <input className={`mt-3 w-full ${inputClass}`} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={`${counterpartyLabel.charAt(0).toUpperCase() + counterpartyLabel.slice(1)} / Société`} />
              <input className={`mt-3 w-full ${inputClass}`} value={clientIce} onChange={(e) => setClientIce(e.target.value)} placeholder={`ICE ${counterpartyLabel}`} />
              <textarea
                className={`mt-3 w-full ${inputClass}`}
                rows={2}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder={`Adresse ${counterpartyLabel} (ex: N130 Bloc 25, Av. Mimosa, Agadir)`}
              />
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-white p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-2xl font-semibold text-[var(--navy)]">Articles</h3>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPickerOpen(true)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-[#f7f7f7]">
                  Choisir un produit
                </button>
                <button type="button" onClick={() => setProductModalOpen(true)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-[#f7f7f7]">
                  + Nouveau produit
                </button>
                <button type="button" onClick={addEmptyItem} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-[#f7f7f7]">
                  + Article passager
                </button>
                <button type="button" onClick={addNoteItem} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-[#f7f7f7]">
                  + Note / commentaire
                </button>
                <button
                  type="button"
                  onClick={() => setIncludeCachet((value) => !value)}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    includeCachet
                      ? "border border-[#de7a3a] bg-[#de7a3a] text-white"
                      : "border border-border hover:bg-[#f7f7f7]"
                  }`}
                  aria-pressed={includeCachet}
                >
                  {includeCachet ? "✓ Cachet & signature" : "+ Cachet & signature"}
                </button>
              </div>
            </div>
            <div className="mt-3 hidden lg:grid lg:grid-cols-12 gap-2 rounded-md border border-border bg-[#f6f8fb] p-2 text-xs uppercase tracking-[0.08em] text-[var(--graphite)]/70">
              <span className="lg:col-span-2">Ref</span>
              <span className="lg:col-span-4">Désignation</span>
              <span className="lg:col-span-1">Unité</span>
              <span className="lg:col-span-1">Qté</span>
              <span className="lg:col-span-2">Prix HT / TTC</span>
              <span className="lg:col-span-2">Montant HT / TTC</span>
            </div>
            <div className="mt-3 space-y-3">
              {items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="grid lg:grid-cols-12 gap-2 rounded-md border border-border p-3">
                  {item.isNote ? (
                    <>
                      <div className="lg:col-span-10 flex items-start gap-2">
                        <span className="mt-2 rounded-md bg-[#fff4e8] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[#b04a09]">
                          Note
                        </span>
                        <textarea
                          rows={2}
                          className={`flex-1 text-sm italic ${inputClassDense}`}
                          value={item.designation}
                          onChange={(e) => updateItem(idx, { designation: e.target.value })}
                          placeholder="Ex: Mode de paiement: 5 jours apres chaque fin de mois"
                        />
                      </div>
                      <div className="lg:col-span-2 flex items-center justify-end">
                        <button type="button" className={btnDanger} onClick={() => void removeItem(idx)}>
                          Supprimer
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="lg:col-span-2 flex flex-col gap-1">
                        <input className={inputClassDense} value={item.reference} onChange={(e) => updateItem(idx, { reference: e.target.value })} />
                        {item.productId.startsWith("manual-") ? (
                          <span className="rounded-md bg-[#fff4e8] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#b04a09] self-start">
                            Passager
                          </span>
                        ) : null}
                      </div>
                      <input className={`${inputClassDense} lg:col-span-4`} value={item.designation} onChange={(e) => updateItem(idx, { designation: e.target.value })} />
                      <input
                        className={`${inputClassDense} lg:col-span-1 text-sm`}
                        value={item.unit ?? "u"}
                        onChange={(e) => updateItem(idx, { unit: e.target.value })}
                        placeholder="u"
                        list="admin-product-units"
                      />
                      <NumberField className={`${inputClassDense} lg:col-span-1`} value={item.qty} onChange={(v) => updateItem(idx, { qty: v })} />
                      <div className="lg:col-span-2">
                        <HtTtcPriceFields
                          compact
                          vatRate={vatRate}
                          valueHt={item.unitPrice}
                          onChangeHt={(unitPrice) => updateItem(idx, { unitPrice })}
                        />
                      </div>
                      <div className="lg:col-span-2 flex flex-col justify-center gap-1 rounded-md border border-border px-3 py-2 text-xs">
                        <span>
                          HT : <strong>{money(item.qty * item.unitPrice)}</strong>
                        </span>
                        <span className="text-[var(--graphite)]/75">
                          TTC : {formatMoney(item.qty * htToTtc(item.unitPrice, vatRate))}
                        </span>
                        <button type="button" className={`self-end ${btnDanger}`} onClick={() => void removeItem(idx)}>
                          Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4 text-sm text-[var(--graphite)]/80">
              Gere ton catalogue depuis la page produits dediee.
              <Link href="/admin/products" className="ml-2 underline underline-offset-4 text-[var(--navy)]">
                Ouvrir produits
              </Link>
            </div>
          </div>
        </section>

        <aside className="xl:col-span-4 xl:sticky xl:top-24 space-y-3">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/70 px-1">
            Aperçu du document
          </p>
          <DocumentPreview
            documentType={documentType}
            quoteNumber={quoteNumber}
            reference={reference}
            date={date}
            dueDate={dueDate}
            linkedFactureNumber={linkedFactureNumber}
            clientName={clientName}
            clientIce={clientIce}
            isPurchaseOrder={isPurchaseOrder}
            counterpartyMode={counterpartyMode}
            items={items}
            vatRate={vatRate}
            discount={discount}
            deposit={deposit}
            includeCachet={includeCachet}
            template={template}
          />

          <details className="mt-3 rounded-md border border-border p-3 bg-white">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/70">Template pied de page entreprise</summary>
            <div className="mt-3 grid gap-3">
              <input className={inputClass} value={template.sellerAddress} onChange={(e) => setTemplate((t) => ({ ...t, sellerAddress: e.target.value }))} placeholder="Ligne adresse" />
              <input className={inputClass} value={template.sellerLegal} onChange={(e) => setTemplate((t) => ({ ...t, sellerLegal: e.target.value }))} placeholder="Ligne legale" />
              <input className={inputClass} value={template.sellerContact} onChange={(e) => setTemplate((t) => ({ ...t, sellerContact: e.target.value }))} placeholder="Ligne contact" />
            </div>
          </details>

          <Link
            href={facturationDocumentsPath(documentType)}
            className="mt-3 inline-flex w-full rounded-md border border-border px-4 py-2 text-sm hover:bg-white justify-center"
          >
            Documents enregistrés ({savedCount})
          </Link>
        </aside>
      </div>

      <section className="mt-6 rounded-md border border-border p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between bg-white">
        <div className="text-sm text-[var(--graphite)]/80">
          {saveStatus === "saving" ? (
            <span>Enregistrement en cours…</span>
          ) : saveStatus === "saved" ? (
            <span className="text-emerald-700">Document enregistré dans Supabase (base cloud).</span>
          ) : saveStatus === "error" ? (
            <span className="text-rose-700">
              Échec de l&apos;enregistrement
              {saveErrorMessage ? ` : ${saveErrorMessage}` : "."}
            </span>
          ) : (
            <span>
              Les documents sont stockés dans Supabase (pas dans le navigateur). Enregistrez puis exportez en PDF.
            </span>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin" className="rounded-md border border-border px-4 py-2 hover:bg-[#f7f7f7]">
            Annuler
          </Link>
          {editingId && documentType === "facture" ? (
            <Link
              href={facturationBonLivraisonFromFacturePath(editingId)}
              className="rounded-md border border-border px-4 py-2 hover:bg-[#f7f7f7]"
            >
              Créer bon de livraison
            </Link>
          ) : null}
          {editingId ? (
            <Link
              href={facturationBuilderPath(documentType)}
              className="rounded-md border border-border px-4 py-2 hover:bg-[#f7f7f7]"
            >
              Nouveau {documentLabel.toLowerCase()}
            </Link>
          ) : null}
          <button type="button" onClick={saveDraft} className="rounded-md border border-border px-4 py-2 hover:bg-[#f7f7f7]">
            {editingId ? "Mettre à jour" : "Enregistrer"}
          </button>
          <button type="button" onClick={() => { void downloadPdf(); }} className="rounded-md border border-[#de7a3a] bg-[#de7a3a] text-white px-4 py-2 hover:opacity-90">
            Generer document
          </button>
        </div>
      </section>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-md border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h4 className="text-lg font-semibold text-[var(--navy)]">Choisir un produit enregistré</h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPickerOpen(false);
                    setProductModalOpen(true);
                  }}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-[#f7f7f7]"
                >
                  + Nouveau produit
                </button>
                <button type="button" onClick={() => setPickerOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-sm">
                  Fermer
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <ProductCategorySelect
                categories={productCategories}
                value={pickerCategory}
                onChange={setPickerCategory}
                placeholder="Toutes catégories"
              />
              <Link href="/admin/products" className="text-xs text-[var(--navy)] underline underline-offset-2">
                Gérer le catalogue
              </Link>
            </div>
            <div className="mt-3 max-h-[380px] overflow-auto space-y-2">
              {pickerProducts.length === 0 ? (
                <p className="rounded-md border border-border p-3 text-sm text-[var(--graphite)]/80">
                  Aucun produit enregistré. Cliquez sur <strong>+ Nouveau produit</strong> pour en créer un, ou utilisez <strong>+ Article passager</strong> pour une saisie unique.
                </p>
              ) : (
                pickerProducts.map((p) => (
                  <div key={p.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--navy)]">{p.reference} - {p.designation}</p>
                      <p className="text-sm text-[var(--graphite)]/75">
                        {p.category ? (
                          <span className="inline-block rounded-full bg-[#f3f3f3] px-2 py-0.5 text-[10px] uppercase tracking-wide mr-2">
                            {p.category}
                          </span>
                        ) : null}
                        {p.unit ? `${p.unit} · ` : ""}
                        HT {money(p.unitPrice)} · TTC {formatMoney(htToTtc(p.unitPrice, vatRate))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        addItemFromProduct(p.id);
                        setPickerOpen(false);
                      }}
                      className="rounded-md border border-[#de7a3a] bg-[#de7a3a] px-3 py-2 text-sm text-white hover:opacity-90"
                    >
                      Ajouter
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {productModalOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-md border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h4 className="text-lg font-semibold text-[var(--navy)]">Créer un produit</h4>
              <button type="button" onClick={() => setProductModalOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-sm">
                Fermer
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--graphite)]/70">
              Le produit sera enregistré dans votre catalogue et ajouté à la ligne courante. Pour une saisie unique, utilisez <strong>+ Article passager</strong>.
            </p>
            <div className="mt-3 grid gap-2">
              <input
                className={inputClass}
                placeholder="Référence (ex: TVF, NN, …)"
                value={newProductReference}
                onChange={(e) => setNewProductReference(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Désignation"
                value={newProductDesignation}
                onChange={(e) => setNewProductDesignation(e.target.value)}
              />
              <ProductCategorySelect
                categories={productCategories}
                value={newProductCategory}
                onChange={setNewProductCategory}
              />
              <ProductUnitField value={newProductUnit} onChange={setNewProductUnit} required />
              <HtTtcPriceFields vatRate={vatRate} valueHt={newProductPrice} onChangeHt={setNewProductPrice} />
            </div>
            <button
              type="button"
              onClick={() => {
                void createProductFromBuilder();
              }}
              className="mt-3 rounded-md border border-[#de7a3a] bg-[#de7a3a] px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Enregistrer et ajouter
            </button>
          </div>
        </div>
      ) : null}

      {customerPickerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-md border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h4 className="text-lg font-semibold text-[var(--navy)]">
                {`Créer un ${counterpartyLabel}`}
              </h4>
              <button type="button" onClick={() => setCustomerPickerOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-sm">
                Fermer
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--graphite)]/70">
              Cette fiche sera enregistrée dans votre carnet pour réutilisation. Pour une saisie unique, utilisez le mode <strong>Passager</strong>.
            </p>
            <div className="mt-3 grid gap-2">
              {isPurchaseOrder ? (
                <>
                  <input
                    className={inputClass}
                    placeholder="Nom fournisseur"
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Société"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                  <p className="text-xs text-[var(--graphite)]/65">
                    Au moins l&apos;un des deux champs est requis.
                  </p>
                  <input
                    className={inputClass}
                    placeholder="Banque"
                    value={newSupplierBankName}
                    onChange={(e) => setNewSupplierBankName(e.target.value)}
                  />
                  <input
                    className={inputClass}
                    placeholder="RIB (relevé d'identité bancaire)"
                    value={newSupplierRib}
                    onChange={(e) => setNewSupplierRib(e.target.value)}
                  />
                </>
              ) : (
                <input
                  className={inputClass}
                  placeholder={`Nom du ${counterpartyLabel}`}
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              )}
              <input
                className={inputClass}
                placeholder={`ICE ${counterpartyLabel}`}
                value={newCustomerIce}
                onChange={(e) => setNewCustomerIce(e.target.value)}
              />
              <textarea
                rows={2}
                className={inputClass}
                placeholder="Adresse (optionnel)"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                void createCounterpartyFromBuilder();
              }}
              className="mt-3 rounded-md border border-[#de7a3a] bg-[#de7a3a] px-4 py-2 text-sm text-white hover:opacity-90"
            >
              {`Enregistrer le ${counterpartyLabel}`}
            </button>
          </div>
        </div>
      ) : null}

      <datalist id="admin-product-units">
        {PRODUCT_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
    </div>
  );
}
