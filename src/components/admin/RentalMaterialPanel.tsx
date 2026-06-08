"use client";

import { useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type {
  AdminProject,
  GasoilContact,
  MaterialCategory,
  MaterialDetailCategory,
  RentalLocationMode,
  RentalMaterial,
} from "@/components/admin/operations-types";
import type { Supplier } from "@/components/admin/devis-types";
import { MATERIAL_CATEGORY_LABELS, RENTAL_LOCATION_MODE_LABELS } from "@/components/admin/operations-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  labelClass,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import {
  EMPTY_RENTAL_MATERIAL_FORM,
  RentalMaterialFormFields,
  rentalMaterialToForm,
  validateRentalMaterialForm,
  type RentalMaterialFormValues,
} from "@/components/admin/RentalMaterialFormFields";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { materialLabel, materialMatchesDateRange, rentalMaterialPriceSummary } from "@/lib/admin/map-rental-material-catalog";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";

const MATERIAL_CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[];
const RENTAL_MODES = Object.keys(RENTAL_LOCATION_MODE_LABELS) as RentalLocationMode[];

type Props = {
  toast: { success: (m: string) => void; error: (m: string) => void };
  materials: RentalMaterial[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  projects: AdminProject[];
  suppliers: Supplier[];
  gasoilContacts: GasoilContact[];
  onSuppliersChange: (suppliers: Supplier[]) => void;
  onGasoilContactsChange: (contacts: GasoilContact[]) => void;
  materialDetailCategories: MaterialDetailCategory[];
  onMaterialDetailCategoriesChange: (cats: MaterialDetailCategory[]) => void;
};

export function RentalMaterialPanel({
  toast,
  materials,
  loading,
  onRefresh,
  projects,
  suppliers,
  gasoilContacts,
  onSuppliersChange,
  onGasoilContactsChange,
  materialDetailCategories,
  onMaterialDetailCategoriesChange,
}: Props) {
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RentalMaterialFormValues>(EMPTY_RENTAL_MATERIAL_FORM);

  const projectName = (id: string | null) => {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.name ?? "—";
  };

  const ownerOptions = useMemo(() => {
    return [...new Set(materials.map((m) => m.ownerName.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [materials]);

  const driverOptions = useMemo(() => {
    return [...new Set(materials.map((m) => m.driverName.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [materials]);

  const hasActiveFilters =
    filterProjectId !== "" ||
    filterCategory !== "" ||
    filterMode !== "" ||
    filterOwner !== "" ||
    filterDriver !== "" ||
    filterActive !== "" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  const filtered = useMemo(() => {
    let list = materials;
    if (filterProjectId) list = list.filter((m) => m.projectId === filterProjectId);
    if (filterCategory) list = list.filter((m) => m.materialCategory === filterCategory);
    if (filterMode) list = list.filter((m) => m.rentalMode === filterMode);
    if (filterOwner) list = list.filter((m) => m.ownerName.trim() === filterOwner);
    if (filterDriver) list = list.filter((m) => m.driverName.trim() === filterDriver);
    if (filterActive === "active") list = list.filter((m) => m.active);
    if (filterActive === "inactive") list = list.filter((m) => !m.active);
    if (filterDateFrom || filterDateTo) {
      list = list.filter((m) => materialMatchesDateRange(m, filterDateFrom, filterDateTo));
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.designation.toLowerCase().includes(q) ||
        m.reference.toLowerCase().includes(q) ||
        m.matricule.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q) ||
        m.driverName.toLowerCase().includes(q) ||
        m.subCategory.toLowerCase().includes(q) ||
        projectName(m.projectId).toLowerCase().includes(q) ||
        MATERIAL_CATEGORY_LABELS[m.materialCategory].toLowerCase().includes(q) ||
        RENTAL_LOCATION_MODE_LABELS[m.rentalMode].toLowerCase().includes(q),
    );
  }, [
    materials,
    search,
    projects,
    filterProjectId,
    filterCategory,
    filterMode,
    filterOwner,
    filterDriver,
    filterActive,
    filterDateFrom,
    filterDateTo,
  ]);

  function resetForm() {
    setEditId(null);
    setForm(EMPTY_RENTAL_MATERIAL_FORM);
  }

  function openEdit(m: RentalMaterial) {
    setEditId(m.id);
    setForm(rentalMaterialToForm(m));
    setTab("new");
  }

  async function submit() {
    const err = validateRentalMaterialForm(form);
    if (err) {
      toast.error(err);
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/rental-materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId || undefined,
        ...form,
        projectId: form.projectId || null,
        supplierId: form.supplierId || null,
        driverContactId: form.driverContactId || null,
        employeeId: null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editId ? "Matériel mis à jour." : "Matériel enregistré.");
    resetForm();
    await onRefresh();
    setTab("list");
  }

  async function remove(m: RentalMaterial) {
    if (!(await confirmDelete(materialLabel(m)))) return;
    setSaving(true);
    const res = await fetch(`/api/admin/rental-materials?id=${encodeURIComponent(m.id)}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Matériel supprimé.");
    if (editId === m.id) resetForm();
    await onRefresh();
  }

  return (
    <div className="space-y-4">
      <AdminTabs
        tabs={[
          { id: "list", label: "Catalogue", badge: materials.length || undefined },
          { id: "new", label: editId ? "Modifier matériel" : "Nouveau matériel" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <AdminLoading /> : null}

      {!loading && tab === "list" ? (
        <AdminInventoryCard
          title={`Catalogue matériel${hasActiveFilters || search ? ` (${filtered.length})` : ""}`}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Désignation, réf., matricule, chantier…"
          actions={
            <button type="button" className={btnPrimary} onClick={() => { resetForm(); setTab("new"); }}>
              + Nouveau matériel
            </button>
          }
        >
          <div className="flex flex-wrap items-end gap-2 border-b border-border px-4 py-3">
            <div>
              <p className={labelClass}>Chantier</p>
              <select
                className={`${inputClass} mt-1 min-w-[160px]`}
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
              >
                <option value="">Tous chantiers</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>Catégorie</p>
              <select
                className={`${inputClass} mt-1 min-w-[160px]`}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Toutes catégories</option>
                {MATERIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {MATERIAL_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>Mode</p>
              <select
                className={`${inputClass} mt-1 min-w-[160px]`}
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
              >
                <option value="">Tous modes</option>
                {RENTAL_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {RENTAL_LOCATION_MODE_LABELS[mode]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>Fournisseur</p>
              <select
                className={`${inputClass} mt-1 min-w-[160px]`}
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
              >
                <option value="">Tous fournisseurs</option>
                {ownerOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>Conducteur</p>
              <select
                className={`${inputClass} mt-1 min-w-[160px]`}
                value={filterDriver}
                onChange={(e) => setFilterDriver(e.target.value)}
              >
                <option value="">Tous conducteurs</option>
                {driverOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={labelClass}>Statut</p>
              <select
                className={`${inputClass} mt-1 min-w-[140px]`}
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
              >
                <option value="">Tous statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
            <div>
              <p className={labelClass}>Contrat du</p>
              <input
                type="date"
                className={`${inputClass} mt-1 min-w-[140px]`}
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div>
              <p className={labelClass}>Au</p>
              <input
                type="date"
                className={`${inputClass} mt-1 min-w-[140px]`}
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                className={`${btnSecondary} mt-5`}
                onClick={() => {
                  setFilterProjectId("");
                  setFilterCategory("");
                  setFilterMode("");
                  setFilterOwner("");
                  setFilterDriver("");
                  setFilterActive("");
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
              >
                Tout effacer
              </button>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {materials.length === 0
                ? "Aucun matériel — créez une fiche par catégorie avant les bons de location."
                : "Aucun matériel ne correspond aux filtres sélectionnés."}
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Catégorie</th>
                  <th className={thClass}>Réf. / Matricule</th>
                  <th className={thClass}>Désignation</th>
                  <th className={thClass}>Chantier</th>
                  <th className={thClass}>Mode</th>
                  <th className={thClass}>Tarif</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td className={tdClass}>{MATERIAL_CATEGORY_LABELS[m.materialCategory]}</td>
                    <td className={`${tdClass} font-mono text-xs`}>{m.reference || m.matricule || "—"}</td>
                    <td className={tdClass}>{m.designation}</td>
                    <td className={tdClass}>{projectName(m.projectId)}</td>
                    <td className={tdClass}>{RENTAL_LOCATION_MODE_LABELS[m.rentalMode]}</td>
                    <td className={`${tdClass} tabular-nums`}>{rentalMaterialPriceSummary(m)}</td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className={btnSecondary} onClick={() => openEdit(m)}>
                          Modif.
                        </button>
                        <button type="button" className={btnDanger} onClick={() => void remove(m)}>
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
      ) : null}

      {!loading && tab === "new" ? (
        <AdminFormCard
          title={editId ? "Modifier le matériel" : "Nouveau matériel"}
          hint="Fiche matériel par catégorie — chantier, tarif, fournisseur, conducteur. Les bons contrat se créent dans Bons location."
          footer={
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnSecondary} onClick={() => { resetForm(); setTab("list"); }}>
                Annuler
              </button>
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
                {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Enregistrer le matériel"}
              </button>
            </div>
          }
        >
          <div className={`${formGridClass} max-w-3xl`}>
            <RentalMaterialFormFields
              values={form}
              onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
              projects={projects}
              suppliers={suppliers}
              gasoilContacts={gasoilContacts}
              materialDetailCategories={materialDetailCategories}
              onSupplierAdded={(supplier) =>
                onSuppliersChange(suppliers.some((s) => s.id === supplier.id) ? suppliers : [...suppliers, supplier])
              }
              onGasoilContactAdded={(contact) =>
                onGasoilContactsChange(
                  gasoilContacts.some((c) => c.id === contact.id) ? gasoilContacts : [...gasoilContacts, contact],
                )
              }
              onMaterialDetailCategoriesChange={onMaterialDetailCategoriesChange}
            />
          </div>
        </AdminFormCard>
      ) : null}
    </div>
  );
}
