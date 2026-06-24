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
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { CustomersPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";

type CustomerFormState = {
  name: string;
  ice: string;
  city: string;
  address: string;
};

const EMPTY_FORM: CustomerFormState = {
  name: "",
  ice: "",
  city: "",
  address: "",
};

function customerToForm(customer: Customer): CustomerFormState {
  return {
    name: customer.name,
    ice: customer.ice || "",
    city: customer.city || "",
    address: customer.address || "",
  };
}

export function CustomersManager() {
  const toast = useAdminToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormState>(EMPTY_FORM);
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

  const { sort, onSort, applySort } = useTableSort("name", "asc");

  const sortAccessors = useMemo(
    () => ({
      name: (c: Customer) => c.name,
      ice: (c: Customer) => c.ice,
      city: (c: Customer) => c.city || "",
      address: (c: Customer) => c.address || "",
    }),
    [],
  );

  const sortedRows = useMemo(
    () => applySort(filtered, sortAccessors),
    [filtered, applySort, sortAccessors],
  );

  function resetForm() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(customer: Customer) {
    setEditId(customer.id);
    setForm(customerToForm(customer));
    setShowForm(true);
  }

  async function saveCustomer() {
    if (!form.name.trim()) {
      toast.error("Le nom du client est obligatoire.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId || undefined,
        name: form.name.trim(),
        ice: form.ice.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editId ? "Client mis à jour." : "Client ajouté.");
    resetForm();
    await refreshCustomers();
  }

  async function deleteCustomer(customer: Customer) {
    if (!(await confirmDelete(customer.name))) return;
    const res = await fetch(`/api/admin/customers?id=${encodeURIComponent(customer.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Client supprimé.");
    if (editId === customer.id) resetForm();
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
                if (showForm) resetForm();
                else openCreate();
              }}
            >
              {showForm ? "Annuler" : "Créer un client"}
            </button>
          </>
        }
      />

      {showForm ? (
        <div className="mb-4">
          <AdminFormCard
            title={editId ? "Modifier le client" : "Nouveau client"}
            hint="ICE et adresse optionnels."
            footer={
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} onClick={resetForm}>
                  Annuler
                </button>
                <button type="button" onClick={() => void saveCustomer()} disabled={saving} className={btnPrimary}>
                  {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Ajouter le client"}
                </button>
              </div>
            }
          >
            <div className={formGridClass}>
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Raison sociale *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="ICE"
                value={form.ice}
                onChange={(e) => setForm((f) => ({ ...f, ice: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Ville"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Adresse"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
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
              {!showForm ? (
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={openCreate}>
                  Créer un client
                </button>
              ) : null}
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="Nom" sortKey="name" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="ICE" sortKey="ice" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Ville" sortKey="city" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Adresse" sortKey="address" sort={sort} onSort={onSort} />
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((customer) => (
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
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => openEdit(customer)} className={btnSecondary}>
                          Modif.
                        </button>
                        <button type="button" onClick={() => void deleteCustomer(customer)} className={btnDanger}>
                          Suppr.
                        </button>
                      </div>
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
