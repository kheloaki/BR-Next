"use client";

import { useEffect, useMemo, useState } from "react";
import type { Supplier } from "@/components/admin/devis-types";
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
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function SuppliersManager() {
  const toast = useAdminToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIce, setNewIce] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newContact, setNewContact] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/suppliers", { cache: "no-store" });
    if (res.ok) setSuppliers((await res.json()) as Supplier[]);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ice.toLowerCase().includes(q) ||
        (s.city || "").toLowerCase().includes(q) ||
        (s.contact || "").toLowerCase().includes(q) ||
        (s.address || "").toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  function resetCreateForm() {
    setNewName("");
    setNewIce("");
    setNewCity("");
    setNewAddress("");
    setNewContact("");
  }

  async function addSupplier() {
    if (!newName.trim()) {
      toast.error("Le nom du fournisseur est obligatoire.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        ice: newIce.trim(),
        city: newCity.trim(),
        address: newAddress.trim(),
        contact: newContact.trim(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Impossible d'ajouter le fournisseur.");
      return;
    }
    toast.success("Fournisseur ajouté.");
    resetCreateForm();
    setShowCreateForm(false);
    await refresh();
  }

  async function deleteSupplier(supplier: Supplier) {
    if (!(await confirmDelete(supplier.name))) return;
    const res = await fetch(`/api/admin/suppliers?id=${encodeURIComponent(supplier.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error("Impossible de supprimer.");
      return;
    }
    toast.success("Fournisseur supprimé.");
    await refresh();
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Fournisseurs"
        description="Carnet fournisseurs pour les bons de commande et achats."
        actions={
          <>
            <a
              href="/admin/facturation/bon-commande"
              className="text-sm font-medium text-[var(--navy)] underline underline-offset-2"
            >
              Nouveau bon de commande
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
              {showCreateForm ? "Annuler" : "Créer un fournisseur"}
            </button>
          </>
        }
      />

      {showCreateForm ? (
        <div className="mb-4">
          <AdminFormCard
            title="Nouveau fournisseur"
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
                <button type="button" onClick={() => void addSupplier()} disabled={saving} className={btnPrimary}>
                  {saving ? "Enregistrement…" : "Ajouter le fournisseur"}
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
                className={inputClass}
                placeholder="Contact (tél. / email)"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
              />
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
        <AdminLoading />
      ) : (
        <AdminInventoryCard
          title="Liste des fournisseurs"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom, ICE, contact…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucun fournisseur enregistré."}
              {!showCreateForm ? (
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setShowCreateForm(true)}>
                  Créer un fournisseur
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
                  <th className={thClass}>Contact</th>
                  <th className={thClass}>Adresse</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr key={supplier.id} className={rowHover}>
                    <td className={tdClass}>{supplier.name}</td>
                    <td className={tdClass}>{supplier.ice || "—"}</td>
                    <td className={tdClass}>{supplier.city || "—"}</td>
                    <td className={tdClass}>{supplier.contact || "—"}</td>
                    <td className={tdClass}>{supplier.address || "—"}</td>
                    <td className={tdClass}>
                      <button type="button" onClick={() => void deleteSupplier(supplier)} className={btnDanger}>
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
