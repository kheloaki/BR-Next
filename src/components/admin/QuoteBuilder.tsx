"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { downloadDevisPdf } from "@/components/admin/devis-pdf";
import {
  DEFAULT_PRODUCTS,
  type Customer,
  defaultTemplate,
  type DevisTemplate,
  type Product,
  type QuoteDraft,
  type LineItem,
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

export function QuoteBuilder() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [template, setTemplate] = useState<DevisTemplate>(defaultTemplate);
  const [savedCount, setSavedCount] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerIce, setNewCustomerIce] = useState("");

  const [clientName, setClientName] = useState("STE CEMOS-CIMENT");
  const [clientIce, setClientIce] = useState("00033383000065");
  const [quoteNumber, setQuoteNumber] = useState("39");
  const [reference, setReference] = useState("N38");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [vatRate, setVatRate] = useState(20);
  const [discount, setDiscount] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [items, setItems] = useState<LineItem[]>([
    {
      productId: DEFAULT_PRODUCTS[0].id,
      reference: DEFAULT_PRODUCTS[0].reference,
      designation: DEFAULT_PRODUCTS[0].designation,
      qty: 2,
      unitPrice: DEFAULT_PRODUCTS[0].unitPrice,
    },
  ]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [productsRes, templateRes, quotesRes, customersRes] = await Promise.all([
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/template", { cache: "no-store" }),
          fetch("/api/admin/quotes", { cache: "no-store" }),
          fetch("/api/admin/customers", { cache: "no-store" }),
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
          setSavedCount(quotes.length);
        }
        if (customersRes.ok) {
          setCustomers((await customersRes.json()) as Customer[]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

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

  const totals = useMemo(() => {
    const totalHt = items.reduce((acc, item) => acc + item.qty * item.unitPrice, 0);
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

  function onSelectCustomer(customerId: string) {
    setSelectedCustomerId(customerId);
    const c = customers.find((x) => x.id === customerId);
    if (!c) return;
    setClientName(c.name);
    setClientIce(c.ice);
  }

  async function createCustomerFromBuilder() {
    if (!newCustomerName.trim()) return;
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCustomerName.trim(),
        ice: newCustomerIce.trim(),
      }),
    });
    if (!res.ok) return;
    const created = (await res.json()) as Customer;
    const customersRes = await fetch("/api/admin/customers", { cache: "no-store" });
    if (customersRes.ok) {
      setCustomers((await customersRes.json()) as Customer[]);
    }
    setSelectedCustomerId(created.id);
    setClientName(created.name);
    setClientIce(created.ice);
    setNewCustomerName("");
    setNewCustomerIce("");
    setCustomerPickerOpen(false);
  }

  function currentDraft(): QuoteDraft {
    return {
      id: uid("qte"),
      createdAt: new Date().toISOString(),
      clientName,
      clientIce,
      quoteNumber,
      reference,
      date,
      vatRate,
      discount,
      deposit,
      items,
    };
  }

  function saveDraft() {
    const draft = currentDraft();
    void fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }).then(async (res) => {
      if (!res.ok) return;
      const quotesRes = await fetch("/api/admin/quotes", { cache: "no-store" });
      if (!quotesRes.ok) return;
      const quotes = (await quotesRes.json()) as QuoteDraft[];
      setSavedCount(quotes.length);
    });
  }

  function downloadPdf() {
    downloadDevisPdf(currentDraft(), template);
  }

  return (
    <div className="rounded-md border border-border bg-[#fbfbfb] p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-3xl font-semibold text-[var(--navy)]">Creer un devis</h2>
        <div className="flex gap-2">
          <button type="button" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-white">
            Plus de details
          </button>
          <button type="button" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-white">
            Masquer l'apercu
          </button>
          <button type="button" className="rounded-md border border-[#de7a3a] bg-[#de7a3a] px-3 py-2 text-sm text-white hover:opacity-90">
            Verifier le devis
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-8">
          <div className="rounded-md border border-border bg-white p-4 lg:p-5">
            <h3 className="text-2xl font-semibold text-[var(--navy)]">Entete</h3>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <input className="rounded-md border border-border bg-[#f9f9f9] p-3" value={quoteNumber} onChange={(e) => setQuoteNumber(e.target.value)} placeholder="Numero devis (ex: 39)" />
              <input className="rounded-md border border-border bg-[#f9f9f9] p-3" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference (ex: N38)" />
              <input type="date" className="rounded-md border border-border bg-[#f9f9f9] p-3" value={date} onChange={(e) => setDate(e.target.value)} />
              <input type="number" className="rounded-md border border-border bg-[#f9f9f9] p-3" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value) || 0)} placeholder="TVA % (ex: 20)" />
            </div>
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-md border border-border bg-white p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/70">De</p>
              <input className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full" value={template.sellerName} onChange={(e) => setTemplate((t) => ({ ...t, sellerName: e.target.value }))} placeholder="Nom entreprise" />
              <input className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full" value={template.sellerActivity} onChange={(e) => setTemplate((t) => ({ ...t, sellerActivity: e.target.value }))} placeholder="Activite entreprise" />
            </div>
            <div className="rounded-md border border-border bg-white p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--graphite)]/70">Facturer a</p>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <select
                  className="rounded-md border border-border bg-[#f9f9f9] p-3"
                  value={selectedCustomerId}
                  onChange={(e) => onSelectCustomer(e.target.value)}
                >
                  <option value="">Selectionner un client</option>
                  {customers.map((c) => (
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
              <input className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client / Societe" />
              <input className="mt-3 rounded-md border border-border bg-[#f9f9f9] p-3 w-full" value={clientIce} onChange={(e) => setClientIce(e.target.value)} placeholder="ICE client" />
            </div>
          </div>

          <div className="mt-4 rounded-md border border-border bg-white p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-[var(--navy)]">Articles</h3>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={addEmptyItem} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-[#f7f7f7]">
                  + nn
                </button>
                <button type="button" onClick={() => setPickerOpen(true)} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-[#f7f7f7]">
                  Choisir produit
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
                  <input className="rounded-md border border-border bg-[#f9f9f9] p-2 lg:col-span-2" value={item.reference} onChange={(e) => updateItem(idx, { reference: e.target.value })} />
                  <input className="rounded-md border border-border bg-[#f9f9f9] p-2 lg:col-span-5" value={item.designation} onChange={(e) => updateItem(idx, { designation: e.target.value })} />
                  <input type="number" className="rounded-md border border-border bg-[#f9f9f9] p-2 lg:col-span-1" value={item.qty} onChange={(e) => updateItem(idx, { qty: Math.max(1, Number(e.target.value) || 1) })} />
                  <input type="number" className="rounded-md border border-border bg-[#f9f9f9] p-2 lg:col-span-2" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} />
                  <div className="lg:col-span-2 flex items-center justify-between rounded-md border border-border px-3">
                    <span className="text-sm font-medium">{money(item.qty * item.unitPrice)}</span>
                    <button className="text-rose-700 text-sm" onClick={() => removeItem(idx)} type="button">
                      🗑
                    </button>
                  </div>
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
                <p className="text-xs uppercase text-[var(--graphite)]/70">DEVIS PRO FORMA</p>
                <p className="text-sm font-semibold">#{quoteNumber || "-"}</p>
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
              <p className="uppercase text-[var(--graphite)]/60">Client</p>
              <p className="font-medium text-[var(--navy)] mt-1">{clientName || "-"}</p>
              <p className="text-[var(--graphite)]/80">ICE: {clientIce || "-"}</p>
            </div>

            <div className="mt-3 rounded-md border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_50px_90px] bg-[#f6f8fb] px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-[var(--graphite)]/70">
                <span>Article</span>
                <span className="text-right">Qte</span>
                <span className="text-right">Montant</span>
              </div>
              <div className="divide-y divide-border bg-white">
                {items.slice(0, 3).map((item, idx) => (
                  <div key={`${item.productId}-preview-${idx}`} className="grid grid-cols-[1fr_50px_90px] px-2 py-1.5 text-[11px]">
                    <p className="truncate text-[var(--navy)]">{item.designation}</p>
                    <p className="text-right text-[var(--graphite)]/80">{item.qty}</p>
                    <p className="text-right font-medium text-[var(--navy)]">{money(item.qty * item.unitPrice)}</p>
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
            Devis enregistres ({savedCount})
          </Link>
        </aside>
      </div>

      <section className="mt-6 rounded-md border border-border p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between bg-white">
        <p className="text-sm text-[var(--graphite)]/80">
          Enregistrez puis telechargez a tout moment depuis la page des devis enregistres.
        </p>
        <div className="flex gap-3">
          <Link href="/admin" className="rounded-md border border-border px-4 py-2 hover:bg-[#f7f7f7]">
            Annuler
          </Link>
          <button type="button" onClick={saveDraft} className="rounded-md border border-border px-4 py-2 hover:bg-[#f7f7f7]">
            Enregistrer brouillon
          </button>
          <button type="button" onClick={downloadPdf} className="rounded-md border border-[#de7a3a] bg-[#de7a3a] text-white px-4 py-2 hover:opacity-90">
            Generer document
          </button>
        </div>
      </section>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-md border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h4 className="text-lg font-semibold text-[var(--navy)]">Choisir un produit enregistre</h4>
              <button type="button" onClick={() => setPickerOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-sm">
                Fermer
              </button>
            </div>
            <div className="mt-3 max-h-[380px] overflow-auto space-y-2">
              {products.length === 0 ? (
                <p className="rounded-md border border-border p-3 text-sm text-[var(--graphite)]/80">
                  Aucun produit enregistre. Ajoutez-les depuis la page produits.
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

      {customerPickerOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl rounded-md border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <h4 className="text-lg font-semibold text-[var(--navy)]">Creer un client</h4>
              <button type="button" onClick={() => setCustomerPickerOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-sm">
                Fermer
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              <input
                className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
                placeholder="Nom du client"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
              <input
                className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
                placeholder="ICE client"
                value={newCustomerIce}
                onChange={(e) => setNewCustomerIce(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                void createCustomerFromBuilder();
              }}
              className="mt-3 rounded-md border border-[#de7a3a] bg-[#de7a3a] px-4 py-2 text-sm text-white hover:opacity-90"
            >
              Enregistrer client
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
