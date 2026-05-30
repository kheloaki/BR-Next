"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import type { RentalMaterial } from "@/components/admin/operations-types";
import { MATERIAL_CATEGORY_LABELS } from "@/components/admin/operations-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  moduleWrap,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import {
  EMPTY_RENTAL_MATERIAL_FORM,
  RentalMaterialFormFields,
  validateRentalMaterialForm,
  type RentalMaterialFormValues,
} from "@/components/admin/RentalMaterialFormFields";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";

type Props = {
  toast: { success: (m: string) => void; error: (m: string) => void };
  materials: RentalMaterial[];
  loading: boolean;
  onRefresh: () => Promise<void>;
};

export function RentalMaterialPanel({ toast, materials, loading, onRefresh }: Props) {
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RentalMaterialFormValues>(EMPTY_RENTAL_MATERIAL_FORM);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.designation.toLowerCase().includes(q) ||
        m.reference.toLowerCase().includes(q) ||
        m.matricule.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q) ||
        MATERIAL_CATEGORY_LABELS[m.materialCategory].toLowerCase().includes(q),
    );
  }, [materials, search]);

  function resetForm() {
    setEditId(null);
    setForm(EMPTY_RENTAL_MATERIAL_FORM);
  }

  function openEdit(m: RentalMaterial) {
    setEditId(m.id);
    setForm({
      materialCategory: m.materialCategory,
      reference: m.reference,
      matricule: m.matricule,
      designation: m.designation,
      subCategory: m.subCategory,
      ownerName: m.ownerName,
    });
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
      body: JSON.stringify({ id: editId || undefined, ...form }),
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
          title="Catalogue matériel"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Désignation, réf., matricule…"
          actions={
            <button type="button" className={btnPrimary} onClick={() => { resetForm(); setTab("new"); }}>
              + Nouveau matériel
            </button>
          }
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              Aucun matériel — créez le catalogue avant les bons location.
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Catégorie</th>
                  <th className={thClass}>Réf. / Matricule</th>
                  <th className={thClass}>Désignation</th>
                  <th className={thClass}>Propriétaire</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id}>
                    <td className={tdClass}>{MATERIAL_CATEGORY_LABELS[m.materialCategory]}</td>
                    <td className={`${tdClass} font-mono text-xs`}>{m.reference || m.matricule || "—"}</td>
                    <td className={tdClass}>{m.designation}</td>
                    <td className={tdClass}>{m.ownerName || "—"}</td>
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
          hint="Fiche matériel du parc — sans tarif ni bon de location."
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
            <RentalMaterialFormFields values={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
          </div>
        </AdminFormCard>
      ) : null}
    </div>
  );
}
