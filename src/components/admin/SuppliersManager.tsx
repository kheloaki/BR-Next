"use client";

import { useEffect, useState } from "react";
import type { Supplier } from "@/components/admin/devis-types";

export function SuppliersManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [newName, setNewName] = useState("");
  const [newIce, setNewIce] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newContact, setNewContact] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/suppliers", { cache: "no-store" });
    if (!res.ok) return;
    setSuppliers((await res.json()) as Supplier[]);
  }

  useEffect(() => {
    void refresh();
  }, []);

  function addSupplier() {
    if (!newName.trim()) return;
    void fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        ice: newIce.trim(),
        city: newCity.trim(),
        address: newAddress.trim(),
        contact: newContact.trim(),
      }),
    }).then(async (res) => {
      if (!res.ok) return;
      await refresh();
      setNewName("");
      setNewIce("");
      setNewCity("");
      setNewAddress("");
      setNewContact("");
    });
  }

  function updateSupplier(id: string, patch: Partial<Supplier>) {
    const current = suppliers.find((c) => c.id === id);
    if (!current) return;
    void fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: patch.name ?? current.name,
        ice: patch.ice ?? current.ice,
        city: patch.city ?? current.city ?? "",
        address: patch.address ?? current.address ?? "",
        contact: patch.contact ?? current.contact ?? "",
      }),
    }).then(async () => {
      await refresh();
    });
  }

  function deleteSupplier(id: string) {
    void fetch(`/api/admin/suppliers?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then(async () => {
      await refresh();
    });
  }

  return (
    <div className="rounded-md border border-border bg-[#fbfbfb] p-4 lg:p-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-2xl font-semibold text-[var(--navy)]">Fournisseurs</h2>
        <p className="text-sm text-[var(--graphite)]/80 mt-1">
          Gérer les fournisseurs disponibles dans le sélecteur des bons de commande.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-border bg-white p-3">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--graphite)]/70">Créer un fournisseur</p>
        <div className="mt-2 grid md:grid-cols-5 gap-2">
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="Nom" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="ICE" value={newIce} onChange={(e) => setNewIce(e.target.value)} />
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="Ville" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="Adresse" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="Contact (tel / email)" value={newContact} onChange={(e) => setNewContact(e.target.value)} />
        </div>
        <button type="button" onClick={addSupplier} className="mt-3 rounded-md border border-[#de7a3a] bg-[#de7a3a] px-4 py-2 text-sm text-white hover:opacity-90">
          Ajouter le fournisseur
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {suppliers.length === 0 ? (
          <p className="rounded-md border border-border bg-white p-3 text-sm text-[var(--graphite)]/70">
            Aucun fournisseur enregistré.
          </p>
        ) : (
          suppliers.map((supplier) => (
            <div key={supplier.id} className="rounded-md border border-border bg-white p-3 grid md:grid-cols-12 gap-2">
              <input className="md:col-span-3 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={supplier.name} onChange={(e) => updateSupplier(supplier.id, { name: e.target.value })} />
              <input className="md:col-span-2 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={supplier.ice} onChange={(e) => updateSupplier(supplier.id, { ice: e.target.value })} />
              <input className="md:col-span-2 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={supplier.city ?? ""} onChange={(e) => updateSupplier(supplier.id, { city: e.target.value })} />
              <input className="md:col-span-2 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={supplier.address ?? ""} onChange={(e) => updateSupplier(supplier.id, { address: e.target.value })} />
              <input className="md:col-span-2 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={supplier.contact ?? ""} onChange={(e) => updateSupplier(supplier.id, { contact: e.target.value })} />
              <button type="button" onClick={() => deleteSupplier(supplier.id)} className="md:col-span-1 rounded-md border border-border p-2.5 text-sm hover:bg-[#f7f7f7]">
                Suppr
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
