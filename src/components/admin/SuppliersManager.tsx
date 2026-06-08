"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Supplier } from "@/components/admin/devis-types";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  categorySegmentBtnSelected,
  categorySegmentBtnUnselected,
  formGridClass,
  inputClass,
  labelClass,
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
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import {
  formatSupplyTypesLabels,
  SUPPLIER_SUPPLY_TYPE_LABELS,
  SUPPLIER_SUPPLY_TYPES,
  type SupplierSupplyType,
} from "@/lib/admin/supplier-types";

type SupplierFormState = {
  supplierName: string;
  companyName: string;
  ice: string;
  city: string;
  address: string;
  contact: string;
  bankName: string;
  rib: string;
  types: SupplierSupplyType[];
};

const EMPTY_FORM: SupplierFormState = {
  supplierName: "",
  companyName: "",
  ice: "",
  city: "",
  address: "",
  contact: "",
  bankName: "",
  rib: "",
  types: [],
};

function supplierToForm(supplier: Supplier): SupplierFormState {
  return {
    supplierName: supplier.supplierName || "",
    companyName: supplier.companyName || "",
    ice: supplier.ice || "",
    city: supplier.city || "",
    address: supplier.address || "",
    contact: supplier.contact || "",
    bankName: supplier.bankName || "",
    rib: supplier.rib || "",
    types: supplier.supplyTypes?.length ? [...supplier.supplyTypes] : ["divers"],
  };
}

export function SuppliersManager() {
  const toast = useAdminToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    const res = await fetch("/api/admin/suppliers", { cache: "no-store" });
    if (!res.ok) {
      setLoadError("Impossible de charger les fournisseurs.");
      setSuppliers([]);
    } else {
      setSuppliers((await res.json()) as Supplier[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.supplierName || "").toLowerCase().includes(q) ||
        (s.companyName || "").toLowerCase().includes(q) ||
        s.ice.toLowerCase().includes(q) ||
        (s.city || "").toLowerCase().includes(q) ||
        (s.contact || "").toLowerCase().includes(q) ||
        (s.bankName || "").toLowerCase().includes(q) ||
        (s.rib || "").toLowerCase().includes(q) ||
        (s.address || "").toLowerCase().includes(q) ||
        formatSupplyTypesLabels(s.supplyTypes ?? []).toLowerCase().includes(q),
    );
  }, [suppliers, search]);

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

  function openEdit(supplier: Supplier) {
    setEditId(supplier.id);
    setForm(supplierToForm(supplier));
    setShowForm(true);
  }

  function toggleType(t: SupplierSupplyType) {
    setForm((prev) => ({
      ...prev,
      types: prev.types.includes(t) ? prev.types.filter((x) => x !== t) : [...prev.types, t],
    }));
  }

  async function saveSupplier() {
    if (!form.supplierName.trim() && !form.companyName.trim()) {
      toast.error("Indiquez le nom du fournisseur et/ou la société.");
      return;
    }
    if (form.types.length === 0) {
      toast.error("Sélectionnez au moins un type d'approvisionnement.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId || undefined,
        supplierName: form.supplierName.trim(),
        companyName: form.companyName.trim(),
        ice: form.ice.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        contact: form.contact.trim(),
        bankName: form.bankName.trim(),
        rib: form.rib.trim(),
        supplyTypes: form.types,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editId ? "Fournisseur mis à jour." : "Fournisseur ajouté.");
    resetForm();
    await refresh();
  }

  async function deleteSupplier(supplier: Supplier) {
    if (!(await confirmDelete(supplier.name))) return;
    const res = await fetch(`/api/admin/suppliers?id=${encodeURIComponent(supplier.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Fournisseur supprimé.");
    if (editId === supplier.id) resetForm();
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
                if (showForm) resetForm();
                else openCreate();
              }}
            >
              {showForm ? "Annuler" : "Créer un fournisseur"}
            </button>
          </>
        }
      />

      {showForm ? (
        <div className="mb-4">
          <AdminFormCard
            title={editId ? "Modifier le fournisseur" : "Nouveau fournisseur"}
            footer={
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnSecondary} onClick={resetForm}>
                  Annuler
                </button>
                <button type="button" onClick={() => void saveSupplier()} disabled={saving} className={btnPrimary}>
                  {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Ajouter le fournisseur"}
                </button>
              </div>
            }
          >
            <div className={formGridClass}>
              <input
                className={inputClass}
                placeholder="Nom fournisseur"
                value={form.supplierName}
                onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Société"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              />
              <p className="sm:col-span-2 text-xs text-[var(--graphite)]/65">
                Au moins l&apos;un des deux champs est requis.
              </p>
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
                className={inputClass}
                placeholder="Contact (tél. / email)"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Banque"
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="RIB (relevé d'identité bancaire)"
                value={form.rib}
                onChange={(e) => setForm((f) => ({ ...f, rib: e.target.value }))}
              />
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Adresse"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
              <div className="sm:col-span-2">
                <p className={labelClass}>Types d&apos;approvisionnement *</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUPPLIER_SUPPLY_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={form.types.includes(t) ? categorySegmentBtnSelected : categorySegmentBtnUnselected}
                      onClick={() => toggleType(t)}
                    >
                      {SUPPLIER_SUPPLY_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </AdminFormCard>
        </div>
      ) : null}

      {loadError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>
      ) : null}

      {loading ? (
        <AdminLoading />
      ) : (
        <AdminInventoryCard
          title={`Liste des fournisseurs (${filtered.length}${search ? ` / ${suppliers.length}` : ""})`}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom, ICE, banque, RIB, contact…"
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucun fournisseur enregistré."}
              {!showForm ? (
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={openCreate}>
                  Créer un fournisseur
                </button>
              ) : null}
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Nom fournisseur</th>
                  <th className={thClass}>Société</th>
                  <th className={thClass}>ICE</th>
                  <th className={thClass}>Ville</th>
                  <th className={thClass}>Types</th>
                  <th className={thClass}>Contact</th>
                  <th className={thClass}>Banque</th>
                  <th className={thClass}>RIB</th>
                  <th className={thClass}>Adresse</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr key={supplier.id} className={rowHover}>
                    <td className={tdClass}>{supplier.supplierName || "—"}</td>
                    <td className={tdClass}>{supplier.companyName || "—"}</td>
                    <td className={tdClass}>{supplier.ice || "—"}</td>
                    <td className={tdClass}>{supplier.city || "—"}</td>
                    <td className={tdClass}>
                      <span className="text-xs text-[var(--graphite)]/85">
                        {formatSupplyTypesLabels(supplier.supplyTypes ?? [])}
                      </span>
                    </td>
                    <td className={tdClass}>{supplier.contact || "—"}</td>
                    <td className={tdClass}>{supplier.bankName || "—"}</td>
                    <td className={`${tdClass} font-mono text-xs`}>{supplier.rib || "—"}</td>
                    <td className={tdClass}>{supplier.address || "—"}</td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => openEdit(supplier)} className={btnSecondary}>
                          Modif.
                        </button>
                        <button type="button" onClick={() => void deleteSupplier(supplier)} className={btnDanger}>
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
