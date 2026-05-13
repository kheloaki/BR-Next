"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { downloadDevisPdf } from "@/components/admin/devis-pdf";
import {
  DEFAULT_PRODUCTS,
  DOCUMENT_LABELS,
  type Customer,
  defaultTemplate,
  type DevisTemplate,
  type DocumentType,
  type Product,
  type QuoteDraft,
  type LineItem,
  type Supplier,
} from "@/components/admin/devis-types";
import logoHeader from "@/assets/barane-logo-horizontal-transparent.png";

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

export function QuoteBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [template, setTemplate] = useState<DevisTemplate>(defaultTemplate);
  const [savedCount, setSavedCount] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [newProductReference, setNewProductReference] = useState("");
  const [newProductDesignation, setNewProductDesignation] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerIce, setNewCustomerIce] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [counterpartyMode, setCounterpartyMode] = useState<"saved" | "passager">("saved");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [documentType, setDocumentType] = useState<DocumentType>("devis");
  const [includeCachet, setIncludeCachet] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vatRate, setVatRate] = useState(20);
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [items, setItems] = useState<LineItem[]>([]);
  const [allQuotes, setAllQuotes] = useState<QuoteDraft[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [productsRes, templateRes, quotesRes, customersRes, suppliersRes] = await Promise.all([
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/template", { cache: "no-store" }),
          fetch("/api/admin/quotes", { cache: "no-store" }),
          fetch("/api/admin/customers", { cache: "no-store" }),
          fetch("/api/admin/suppliers", { cache: "no-store" }),
        ]);
        if (!mounted) return;

        if (productsRes.ok) {
          const nextProducts = (await productsRes.json()) as Product[];
          setProducts(nextProducts.length > 0 ? nextProducts : DEFAULT_PRODUCTS);
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
      setVatRate(typeof draft.vatRate === "number" ? draft.vatRate : 20);
      setDiscount(typeof draft.discount === "number" ? draft.discount : 0);
      setDeposit(typeof draft.deposit === "number" ? draft.deposit : 0);
      setItems(Array.isArray(draft.items) ? draft.items : []);
    }
    void loadQuote();
    return () => {
      mounted = false;
    };
  }, [editingId]);

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

  const autoNumberInitRef = useRef(false);
  const prevDocTypeRef = useRef(documentType);
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
        qty: 1,
        unitPrice: p.unitPrice,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addEmptyItem() {
    setItems((prev) => [
      ...prev,
      {
        productId: uid("manual"),
        reference: "NN",
        designation: "",
        qty: 1,
        unitPrice: 0,
      },
    ]);
  }

  async function createProductFromBuilder() {
    if (!newProductDesignation.trim()) return;
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: newProductReference.trim() || "NN",
        designation: newProductDesignation.trim(),
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
        qty: 1,
        unitPrice: created.unitPrice,
      },
    ]);
    setNewProductReference("");
    setNewProductDesignation("");
    setNewProductPrice(0);
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

  const isPurchaseOrder = documentType === "bon_commande";
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
    if (!newCustomerName.trim()) return;
    const res = await fetch(counterpartyApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCustomerName.trim(),
        ice: newCustomerIce.trim(),
        address: newCustomerAddress.trim(),
      }),
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
      vatRate,
      discount,
      deposit,
      items,
      includeCachet,
    };
  }

  const documentLabel = DOCUMENT_LABELS[documentType];

  function saveDraft() {
    const draft = currentDraft();
    setSaveStatus("saving");
    void fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).then(async (res) => {
      if (!res.ok) {
        setSaveStatus("error");
        return;
      }
      const result = (await res.json()) as { id?: string; created?: boolean };
      const quotesRes = await fetch("/api/admin/quotes", { cache: "no-store" });
      if (quotesRes.ok) {
        const quotes = (await quotesRes.json()) as QuoteDraft[];
        setAllQuotes(quotes);
        setSavedCount(quotes.length);
      }
      if (!editingId && result.id) {
        router.replace(`/admin/devis-builder?id=${encodeURIComponent(result.id)}`);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    });
  }

  async function downloadPdf() {
    await downloadDevisPdf(currentDraft(), template);
  }

  return (
    <div className="rounded-md border border-border bg-[#fbfbfb] p-4 lg:p-5">
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
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-8">
          <div className="rounded-md border border-border bg-white p-4 lg:p-5">
            <h3 className="text-2xl font-semibold text-[var(--navy)]">Entete</h3>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <input className="rounded-md border border-border bg-[#f9f9f9] p-3" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} placeholder={`Numero ${documentLabel.toLowerCase()} (ex: 001/2026)`} />
              <input className="rounded-md border border-border bg-[#f9f9f9] p-3" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference (ex: N38)" />
              <input type="date" className="rounded-md border border-border bg-[#f9f9f9] p-3" value={date} onChange={(e) => setDate(e.target.value)} />
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
                    className="w-20 rounded-md border border-border bg-[#f9f9f9] px-2 py-1 text-sm"
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
              <input className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full" value={template.sellerName} onChange={(e) => setTemplate((t) => ({ ...t, sellerName: e.target.value }))} placeholder="Nom entreprise" />
              <input className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full" value={template.sellerActivity} onChange={(e) => setTemplate((t) => ({ ...t, sellerActivity: e.target.value }))} placeholder="Activite entreprise" />
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
                    className="rounded-md border border-border bg-[#f9f9f9] p-3"
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
              <input className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={`${counterpartyLabel.charAt(0).toUpperCase() + counterpartyLabel.slice(1)} / Société`} />
              <input className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full" value={clientIce} onChange={(e) => setClientIce(e.target.value)} placeholder={`ICE ${counterpartyLabel}`} />
              <textarea
                className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full"
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
              <span className="lg:col-span-5">Designation</span>
              <span className="lg:col-span-1">Qte</span>
              <span className="lg:col-span-2">Prix unitaire</span>
              <span className="lg:col-span-2">Montant</span>
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
                          className="flex-1 rounded-md border border-border bg-[#f9f9f9] p-2 text-sm italic"
                          value={item.designation}
                          onChange={(e) => updateItem(idx, { designation: e.target.value })}
                          placeholder="Ex: Mode de paiement: 5 jours apres chaque fin de mois"
                        />
                      </div>
                      <div className="lg:col-span-2 flex items-center justify-end">
                        <button className="text-rose-700 text-sm" onClick={() => removeItem(idx)} type="button">
                          Supprimer
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="lg:col-span-2 flex flex-col gap-1">
                        <input className="rounded-md border border-border bg-[#f9f9f9] p-2" value={item.reference} onChange={(e) => updateItem(idx, { reference: e.target.value })} />
                        {item.productId.startsWith("manual-") ? (
                          <span className="rounded-md bg-[#fff4e8] px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#b04a09] self-start">
                            Passager
                          </span>
                        ) : null}
                      </div>
                      <input className="rounded-md border border-border bg-[#f9f9f9] p-2 lg:col-span-5" value={item.designation} onChange={(e) => updateItem(idx, { designation: e.target.value })} />
                      <NumberField className="rounded-md border border-border bg-[#f9f9f9] p-2 lg:col-span-1" value={item.qty} onChange={(v) => updateItem(idx, { qty: v })} />
                      <NumberField className="rounded-md border border-border bg-[#f9f9f9] p-2 lg:col-span-2" value={item.unitPrice} onChange={(v) => updateItem(idx, { unitPrice: v })} />
                      <div className="lg:col-span-2 flex items-center justify-between rounded-md border border-border px-3">
                        <span className="text-sm font-medium">{money(item.qty * item.unitPrice)}</span>
                        <button className="text-rose-700 text-sm" onClick={() => removeItem(idx)} type="button">
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

        <aside className="xl:col-span-4 rounded-md border border-border p-4 lg:p-5 bg-[#f4f4f4] xl:sticky xl:top-24">
          <div className="bg-white rounded-md border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <Image src={logoHeader} alt="BARANE INVEST" width={120} height={30} className="h-8 w-auto object-contain" />
              <div className="text-right">
                <p className="text-xs uppercase text-[var(--graphite)]/70">{documentLabel.toUpperCase()}</p>
                <p className="text-sm font-semibold">N° {quoteNumber || "-"}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-[var(--graphite)]/80">
              <div>
                <p className="uppercase text-[10px] text-[var(--graphite)]/60">Date</p>
                <p className="font-medium text-[var(--navy)]">{date || "-"}</p>
              </div>
              <div className="text-right">
                <p className="uppercase text-[10px] text-[var(--graphite)]/60">Reference</p>
                <p className="font-medium text-[var(--navy)]">{reference || "-"}</p>
              </div>
            </div>
            <div className="mt-4 text-xs rounded-md border border-border bg-[#fcfcfc] p-3">
              <p className="uppercase text-[var(--graphite)]/60">
                {isPurchaseOrder ? "Fournisseur" : "Client"}
                {counterpartyMode === "passager" ? " (passager)" : ""}
              </p>
              <p className="font-medium text-[var(--navy)] mt-1">{clientName || "-"}</p>
              <p className="text-[var(--graphite)]/80">ICE: {clientIce || "-"}</p>
              {clientAddress ? (
                <p className="text-[var(--graphite)]/80 mt-1 whitespace-pre-line">{clientAddress}</p>
              ) : null}
            </div>

            <div className="mt-3 rounded-md border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_50px_90px] bg-[#f6f8fb] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--graphite)]/70">
                <span>Article</span>
                <span className="text-right">Qte</span>
                <span className="text-right">Montant</span>
              </div>
              <div className="divide-y divide-border bg-white">
                {items.slice(0, 4).map((item, idx) => (
                  <div key={`${item.productId}-preview-${idx}`} className="grid grid-cols-[1fr_50px_90px] px-2 py-1.5 text-[11px]">
                    {item.isNote ? (
                      <p className="col-span-3 italic text-[var(--graphite)]/80 truncate">
                        {item.designation || "Note"}
                      </p>
                    ) : (
                      <>
                        <p className="truncate text-[var(--navy)]">{item.designation}</p>
                        <p className="text-right text-[var(--graphite)]/80">{item.qty}</p>
                        <p className="text-right font-medium text-[var(--navy)]">{money(item.qty * item.unitPrice)}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-3 text-xs space-y-1">
              <p className="flex items-center justify-between"><span>Sous-total</span><span className="font-semibold">{money(totals.totalHt)}</span></p>
              <p className="flex items-center justify-between"><span>Remise</span><span className="font-semibold">{money(discount)}</span></p>
              <p className="flex items-center justify-between"><span>TVA</span><span className="font-semibold">{money(totals.vatAmount)}</span></p>
              <p className="flex items-center justify-between"><span>Acompte</span><span className="font-semibold">{money(deposit)}</span></p>
              <p className="pt-1 mt-1 border-t border-border text-[var(--navy)] flex items-center justify-between">
                <span>Total a payer</span><span className="font-bold text-base">{money(totals.netToPay)}</span>
              </p>
            </div>
            {includeCachet ? (
              <div className="mt-3 rounded-md border border-dashed border-[var(--gold)]/60 bg-[#fff8ef] p-2 text-right text-[10px] text-[var(--graphite)]/70">
                Cachet et signature ajoutes au document
              </div>
            ) : null}
          </div>

          <details className="mt-3 rounded-md border border-border p-3 bg-white">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/70">Template pied de page entreprise</summary>
            <div className="mt-3 grid gap-3">
              <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" value={template.sellerAddress} onChange={(e) => setTemplate((t) => ({ ...t, sellerAddress: e.target.value }))} placeholder="Ligne adresse" />
              <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" value={template.sellerLegal} onChange={(e) => setTemplate((t) => ({ ...t, sellerLegal: e.target.value }))} placeholder="Ligne legale" />
              <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" value={template.sellerContact} onChange={(e) => setTemplate((t) => ({ ...t, sellerContact: e.target.value }))} placeholder="Ligne contact" />
            </div>
          </details>

          <Link href="/admin/devis-saved" className="mt-3 inline-flex w-full rounded-md border border-border px-4 py-2 text-sm hover:bg-white justify-center">
            Documents enregistrés ({savedCount})
          </Link>
        </aside>
      </div>

      <section className="mt-6 rounded-md border border-border p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between bg-white">
        <div className="text-sm text-[var(--graphite)]/80">
          {saveStatus === "saving" ? (
            <span>Enregistrement en cours…</span>
          ) : saveStatus === "saved" ? (
            <span className="text-emerald-700">Document enregistré.</span>
          ) : saveStatus === "error" ? (
            <span className="text-rose-700">Échec de l'enregistrement.</span>
          ) : (
            <span>Enregistrez puis téléchargez à tout moment depuis la page documents.</span>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin" className="rounded-md border border-border px-4 py-2 hover:bg-[#f7f7f7]">
            Annuler
          </Link>
          {editingId ? (
            <Link href="/admin/devis-builder" className="rounded-md border border-border px-4 py-2 hover:bg-[#f7f7f7]">
              Nouveau document
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
            <div className="mt-3 max-h-[380px] overflow-auto space-y-2">
              {products.length === 0 ? (
                <p className="rounded-md border border-border p-3 text-sm text-[var(--graphite)]/80">
                  Aucun produit enregistré. Cliquez sur <strong>+ Nouveau produit</strong> pour en créer un, ou utilisez <strong>+ Article passager</strong> pour une saisie unique.
                </p>
              ) : (
                products.map((p) => (
                  <div key={p.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--navy)]">{p.reference} - {p.designation}</p>
                      <p className="text-sm text-[var(--graphite)]/75">Prix unitaire: {money(p.unitPrice)}</p>
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
                className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
                placeholder="Référence (ex: TVF, NN, …)"
                value={newProductReference}
                onChange={(e) => setNewProductReference(e.target.value)}
              />
              <input
                className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
                placeholder="Désignation"
                value={newProductDesignation}
                onChange={(e) => setNewProductDesignation(e.target.value)}
              />
              <NumberField
                className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
                value={newProductPrice}
                onChange={setNewProductPrice}
                placeholder="Prix unitaire"
              />
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
              <input
                className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
                placeholder={`Nom du ${counterpartyLabel}`}
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
              <input
                className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
                placeholder={`ICE ${counterpartyLabel}`}
                value={newCustomerIce}
                onChange={(e) => setNewCustomerIce(e.target.value)}
              />
              <textarea
                rows={2}
                className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
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
    </div>
  );
}
