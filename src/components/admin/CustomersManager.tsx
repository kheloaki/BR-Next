"use client";

import { useEffect, useState } from "react";
import type { Customer } from "@/components/admin/devis-types";

export function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newName, setNewName] = useState("");
  const [newIce, setNewIce] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newAddress, setNewAddress] = useState("");

  async function refreshCustomers() {
    const res = await fetch("/api/admin/customers", { cache: "no-store" });
    if (!res.ok) return;
    setCustomers((await res.json()) as Customer[]);
  }

  useEffect(() => {
    void refreshCustomers();
  }, []);

  function addCustomer() {
    if (!newName.trim()) return;
    void fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        ice: newIce.trim(),
        city: newCity.trim(),
        address: newAddress.trim(),
      }),
    }).then(async (res) => {
      if (!res.ok) return;
      await refreshCustomers();
      setNewName("");
      setNewIce("");
      setNewCity("");
      setNewAddress("");
    });
  }

  function updateCustomer(id: string, patch: Partial<Customer>) {
    const current = customers.find((c) => c.id === id);
    if (!current) return;
    void fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: patch.name ?? current.name,
        ice: patch.ice ?? current.ice,
        city: patch.city ?? current.city ?? "",
        address: patch.address ?? current.address ?? "",
      }),
    }).then(async () => {
      await refreshCustomers();
    });
  }

  function deleteCustomer(id: string) {
    void fetch(`/api/admin/customers?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then(async () => {
      await refreshCustomers();
    });
  }

  return (
    <div className="rounded-md border border-border bg-[#fbfbfb] p-4 lg:p-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-2xl font-semibold text-[var(--navy)]">Clients</h2>
        <p className="text-sm text-[var(--graphite)]/80 mt-1">
          Gerer les clients disponibles dans le selecteur du devis.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-border bg-white p-3">
        <p className="text-xs uppercase tracking-[0.08em] text-[var(--graphite)]/70">Creer un client</p>
        <div className="mt-2 grid md:grid-cols-4 gap-2">
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="Nom" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="ICE" value={newIce} onChange={(e) => setNewIce(e.target.value)} />
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="Ville" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
          <input className="rounded-md border border-border bg-[#f9f9f9] p-2.5" placeholder="Adresse" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
        </div>
        <button type="button" onClick={addCustomer} className="mt-3 rounded-md border border-[#de7a3a] bg-[#de7a3a] px-4 py-2 text-sm text-white hover:opacity-90">
          Ajouter le client
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {customers.map((customer) => (
          <div key={customer.id} className="rounded-md border border-border bg-white p-3 grid md:grid-cols-12 gap-2">
            <input className="md:col-span-3 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={customer.name} onChange={(e) => updateCustomer(customer.id, { name: e.target.value })} />
            <input className="md:col-span-2 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={customer.ice} onChange={(e) => updateCustomer(customer.id, { ice: e.target.value })} />
            <input className="md:col-span-2 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={customer.city ?? ""} onChange={(e) => updateCustomer(customer.id, { city: e.target.value })} />
            <input className="md:col-span-4 rounded-md border border-border bg-[#f9f9f9] p-2.5" value={customer.address ?? ""} onChange={(e) => updateCustomer(customer.id, { address: e.target.value })} />
            <button type="button" onClick={() => deleteCustomer(customer.id)} className="md:col-span-1 rounded-md border border-border p-2.5 text-sm hover:bg-[#f7f7f7]">
              Suppr
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
