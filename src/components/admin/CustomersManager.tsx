"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@/components/admin/devis-types";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { CustomersPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function CustomersManager() {
  const toast = useAdminToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIce, setNewIce] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function refreshCustomers() {
    setLoading(true);
    const res = await fetch("/api/admin/customers", { cache: "no-store" });
    if (res.ok) setCustomers((await res.json()) as Customer[]);
    setLoading(false);
  }

  useEffect(() => {
    void refreshCustomers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ice.toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.address || "").toLowerCase().includes(q),
    );
  }, [customers, search]);

  function resetCreateForm() {
    setNewName("");
    setNewIce("");
    setNewCity("");
    setNewAddress("");
  }

  async function addCustomer() {
    if (!newName.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        ice: newIce.trim(),
        city: newCity.trim(),
        address: newAddress.trim(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Impossible d'ajouter le client.");
      return;
    }
    toast.success("Client ajouté.");
    resetCreateForm();
    setShowCreateForm(false);
    await refreshCustomers();
  }

  async function deleteCustomer(customer: Customer) {
    if (!(await confirmDelete(customer.name))) return;
    const res = await fetch(`/api/admin/customers?id=${encodeURIComponent(customer.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Impossible de supprimer.");
      return;
    }
    toast.success("Client supprimé.");
    await refreshCustomers();
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Clients"
        description="Gérez le carnet client utilisé dans les devis et factures."
        actions={
          <>
            <a
              href="/admin/facturation/devis"
              className="text-sm font-medium text-[var(--navy)] underline underline-offset-2"
            >
              Ouvrir le devis
            </a>
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                if (showCreateForm) {
                  resetCreateForm();
                  setShowCreateForm(false);
                } else {
                  setShowCreateForm(true);
                }
              }}
            >
              {showCreateForm ? "Annuler" : "Créer un client"}
            </button>
          </>
        }
      />

      {showCreateForm ? (
        <div className="mb-4">
          <AdminFormCard
            title="Nouveau client"
            hint="ICE et adresse optionnels."
            footer={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnSecondary}
                  onClick={() => {
                    resetCreateForm();
                    setShowCreateForm(false);
                  }}
                >
                  Annuler
                </button>
                <button type="button" onClick={() => void addCustomer()} disabled={saving} className={btnPrimary}>
                  {saving ? "Enregistrement…" : "Ajouter le client"}
                </button>
              </div>
            }
          >
            <div className={formGridClass}>
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Raison sociale *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input className={inputClass} placeholder="ICE" value={newIce} onChange={(e) => setNewIce(e.target.value)} />
              <input className={inputClass} placeholder="Ville" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Adresse"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
              />
            </div>
          </AdminFormCard>
        </div>
      ) : null}

      {loading ? (
        <CustomersPageSkeleton partial />
      ) : (
        <AdminInventoryCard
          title="Liste des clients"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom, ICE, ville…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucun client enregistré."}
              {!showCreateForm ? (
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setShowCreateForm(true)}>
                  Créer un client
                </button>
              ) : null}
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Nom</th>
                  <th className={thClass}>ICE</th>
                  <th className={thClass}>Ville</th>
                  <th className={thClass}>Adresse</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className={rowHover}>
                    <td className={tdClass}>
                      <AdminTruncatedText text={customer.name} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={customer.ice} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={customer.city} lines={1} />
                    </td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={customer.address} />
                    </td>
                    <td className={tdClass}>
                      <button type="button" onClick={() => void deleteCustomer(customer)} className={btnDanger}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      )}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
