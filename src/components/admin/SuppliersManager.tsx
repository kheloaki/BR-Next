"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Supplier } from "@/components/admin/devis-types";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  moduleWrap,
  alertError,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { SuppliersPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import {
  formatSupplyTypesLabelsFromCatalog,
  type SupplierSupplyTypeOption,
} from "@/lib/admin/supplier-supply-type-catalog";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { SupplierSupplyTypesPicker } from "@/components/admin/SupplierSupplyTypesPicker";
import type { SupplierSupplyType } from "@/lib/admin/supplier-types";

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
  const [supplyTypeOptions, setSupplyTypeOptions] = useState<SupplierSupplyTypeOption[]>([]);

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
        formatSupplyTypesLabelsFromCatalog(s.supplyTypes ?? [], supplyTypeOptions).toLowerCase().includes(q),
    );
  }, [suppliers, search, supplyTypeOptions]);

  function formatTypes(types: SupplierSupplyType[]) {
    return formatSupplyTypesLabelsFromCatalog(types, supplyTypeOptions);
  }

  const { sort, onSort, applySort } = useTableSort("supplierName", "asc");

  const supplierSortAccessors = useMemo(
    () => ({
      supplierName: (s: Supplier) => s.supplierName,
      companyName: (s: Supplier) => s.companyName,
      ice: (s: Supplier) => s.ice,
      city: (s: Supplier) => s.city,
      types: (s: Supplier) => formatTypes(s.supplyTypes ?? []),
      contact: (s: Supplier) => s.contact,
      bankName: (s: Supplier) => s.bankName,
      rib: (s: Supplier) => s.rib,
      address: (s: Supplier) => s.address,
    }),
    [supplyTypeOptions],
  );

  const sortedFiltered = useMemo(
    () => applySort(filtered, supplierSortAccessors),
    [filtered, applySort, supplierSortAccessors],
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

  function openEdit(supplier: Supplier) {
    setEditId(supplier.id);
    setForm(supplierToForm(supplier));
    setShowForm(true);
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
        exportHref="/api/admin/suppliers"
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
              <SupplierSupplyTypesPicker
                className="sm:col-span-2"
                value={form.types}
                onChange={(types) => setForm((f) => ({ ...f, types }))}
                onOptionsChange={setSupplyTypeOptions}
              />
            </div>
          </AdminFormCard>
        </div>
      ) : null}

      {loadError ? (
        <p className={`mb-4 ${alertError}`}>{loadError}</p>
      ) : null}

      {loading ? (
        <SuppliersPageSkeleton partial />
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
                  <AdminSortableTh label="Nom fournisseur" sortKey="supplierName" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Société" sortKey="companyName" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="ICE" sortKey="ice" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Ville" sortKey="city" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Types" sortKey="types" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Contact" sortKey="contact" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Banque" sortKey="bankName" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="RIB" sortKey="rib" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Adresse" sortKey="address" sort={sort} onSort={onSort} />
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map((supplier) => (
                  <tr key={supplier.id} className={rowHover}>
                    <td className={tdClass}>
                      <AdminTruncatedText text={supplier.supplierName} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={supplier.companyName} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={supplier.ice} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={supplier.city} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <span className="text-xs text-[var(--graphite)]/85">
                        {formatTypes(supplier.supplyTypes ?? [])}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={supplier.contact} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={supplier.bankName} lines={1} />
                    </td>
                    <td className={`${tdClass} font-mono text-xs`}>{supplier.rib || "—"}</td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={supplier.address} />
                    </td>
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
