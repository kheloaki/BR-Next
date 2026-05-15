"use client";

import { useEffect, useState } from "react";
import { type Product } from "@/components/admin/devis-types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newReference, setNewReference] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newUnitPrice, setNewUnitPrice] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function loadProducts() {
      const res = await fetch("/api/admin/products", { cache: "no-store" });
      if (!res.ok || !mounted) return;
      setProducts((await res.json()) as Product[]);
    }
    void loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  async function refreshProducts() {
    const res = await fetch("/api/admin/products", { cache: "no-store" });
    if (!res.ok) return;
    setProducts((await res.json()) as Product[]);
  }

  function addProduct() {
    if (!newDesignation.trim()) return;
    void fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: uid("prd"),
        reference: newReference.trim() || "NN",
        designation: newDesignation.trim(),
        unitPrice: Math.max(0, Number(newUnitPrice) || 0),
      }),
    }).then(async (res) => {
      if (!res.ok) return;
      await refreshProducts();
      setNewReference("");
      setNewDesignation("");
      setNewUnitPrice(0);
    });
  }

  function updateProduct(id: string, patch: Partial<Product>) {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    void fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        reference: patch.reference ?? current.reference,
        designation: patch.designation ?? current.designation,
        unitPrice: patch.unitPrice ?? current.unitPrice,
      }),
    }).then(async () => {
      await refreshProducts();
    });
  }

  function removeProduct(id: string) {
    void fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then(async () => {
      await refreshProducts();
    });
  }

  return (
    <div className="rounded-md border border-border bg-[#fbfbfb] p-4 lg:p-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-2xl font-semibold text-[var(--navy)]">Produits</h2>
        <p className="text-sm text-[var(--graphite)]/80 mt-1">
          Gerer les produits enregistres utilises dans la fenetre du devis.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-border bg-white p-3">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--graphite)]/70">Creer un produit</p>
        <div className="mt-2 grid md:grid-cols-3 gap-2">
          <input
            className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
            placeholder="Reference"
            value={newReference}
            onChange={(e) => setNewReference(e.target.value)}
          />
          <input
            className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
            placeholder="Designation"
            value={newDesignation}
            onChange={(e) => setNewDesignation(e.target.value)}
          />
          <input
            type="number"
            className="rounded-md border border-border bg-[#f9f9f9] p-2.5"
            placeholder="Prix unitaire"
            value={newUnitPrice}
            onChange={(e) => setNewUnitPrice(Number(e.target.value) || 0)}
          />
        </div>
        <button
          type="button"
          onClick={addProduct}
          className="mt-3 rounded-md border border-[#de7a3a] bg-[#de7a3a] px-4 py-2 text-sm text-white hover:opacity-90"
        >
          Ajouter le produit
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {products.length === 0 ? (
          <p className="rounded-md border border-border bg-white p-3 text-sm text-[var(--graphite)]/70">
            Aucun produit enregistré. Ajoutez-en un avec le formulaire ci-dessus.
          </p>
        ) : null}
        {products.map((product) => (
          <div key={product.id} className="rounded-md border border-border bg-white p-3 grid md:grid-cols-12 gap-2">
            <input
              className="md:col-span-2 rounded-md border border-border bg-[#f9f9f9] p-2.5"
              value={product.reference}
              onChange={(e) => updateProduct(product.id, { reference: e.target.value })}
            />
            <input
              className="md:col-span-7 rounded-md border border-border bg-[#f9f9f9] p-2.5"
              value={product.designation}
              onChange={(e) => updateProduct(product.id, { designation: e.target.value })}
            />
            <input
              type="number"
              className="md:col-span-2 rounded-md border border-border bg-[#f9f9f9] p-2.5"
              value={product.unitPrice}
              onChange={(e) =>
                updateProduct(product.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })
              }
            />
            <button
              type="button"
              onClick={() => removeProduct(product.id)}
              className="md:col-span-1 rounded-md border border-border p-2.5 text-sm hover:bg-[#f7f7f7]"
            >
              Suppr
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
