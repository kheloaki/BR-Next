"use client";

import { useEffect, useMemo, useState } from "react";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { AdminEquipment } from "@/components/admin/operations-types";
import {
  btnDanger,
  btnPrimary,
  formGridClass,
  inputClass,
  moduleWrap,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { EquipmentPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";

export function EquipmentManager() {
  const toast = useAdminToast();
  const { equipment, loading, refresh } = useOpsReferential();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEqName, setNewEqName] = useState("");
  const [newEqType, setNewEqType] = useState("");

  const { sort, onSort, applySort } = useTableSort("name");

  const filteredEquipment = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return equipment;
    return equipment.filter(
      (e) => e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q),
    );
  }, [equipment, search]);

  const sortAccessors = useMemo(
    () => ({
      name: (e: AdminEquipment) => e.name,
      type: (e: AdminEquipment) => e.type,
      active: (e: AdminEquipment) => (e.active ? 1 : 0),
    }),
    [],
  );

  const sortedEquipment = useMemo(
    () => applySort(filteredEquipment, sortAccessors),
    [filteredEquipment, sortAccessors, applySort],
  );

  async function addEquipment() {
    if (!newEqName.trim()) {
      toast.error("Indiquez le nom de l'engin.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newEqName.trim(), type: newEqType.trim(), active: true }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Engin enregistré.");
    setNewEqName("");
    setNewEqType("");
    setShowCreateForm(false);
    await refresh();
  }

  async function updateEquipment(eq: AdminEquipment, patch: Partial<AdminEquipment>) {
    await fetch("/api/admin/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: eq.id,
        name: patch.name ?? eq.name,
        type: patch.type ?? eq.type,
        active: patch.active ?? eq.active,
      }),
    });
    await refresh();
  }

  async function removeEquipment(eq: AdminEquipment) {
    if (!(await confirmDelete(eq.name))) return;
    const res = await fetch(`/api/admin/equipment?id=${encodeURIComponent(eq.id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Engin supprimé.");
    await refresh();
  }

  function openCreateForm() {
    setShowCreateForm(true);
    requestAnimationFrame(() => {
      document.getElementById("equipment-add-form")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Engins"
        description="Parc matériel partagé (carburant, pièces, location, etc.)."
        actions={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => (showCreateForm ? setShowCreateForm(false) : openCreateForm())}
          >
            {showCreateForm ? "Annuler" : "Ajouter un engin"}
          </button>
        }
      />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Total", value: String(equipment.length) },
            { label: "Actifs", value: String(equipment.filter((e) => e.active).length) },
          ]}
        />
      ) : null}

      {loading ? <EquipmentPageSkeleton partial /> : null}

      {!loading && showCreateForm ? (
        <div id="equipment-add-form" className="mb-4">
          <AdminFormCard
            title="Nouvel engin"
            footer={
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void addEquipment()}>
                {saving ? "Enregistrement…" : "Ajouter l'engin"}
              </button>
            }
          >
            <div className={`${formGridClass} sm:grid-cols-2`}>
              <input
                className={inputClass}
                placeholder="Nom *"
                value={newEqName}
                onChange={(e) => setNewEqName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Type (bulldozer, foreuse…)"
                value={newEqType}
                onChange={(e) => setNewEqType(e.target.value)}
              />
            </div>
          </AdminFormCard>
        </div>
      ) : null}

      {!loading ? (
        <AdminInventoryCard
          title="Liste des engins"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom, type…"
        >
          {filteredEquipment.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat pour ce filtre." : "Aucun engin enregistré."}
              {!showCreateForm ? (
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={openCreateForm}>
                  Ajouter un engin
                </button>
              ) : null}
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh label="Nom" sortKey="name" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Type" sortKey="type" sort={sort} onSort={onSort} />
                  <AdminSortableTh label="Actif" sortKey="active" sort={sort} onSort={onSort} />
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {sortedEquipment.map((eq) => (
                  <tr key={eq.id}>
                    <td className={tdClass}>
                      <input
                        className={inputClass}
                        defaultValue={eq.name}
                        onBlur={(e) => {
                          const name = e.target.value.trim();
                          if (name && name !== eq.name) void updateEquipment(eq, { name });
                        }}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        className={inputClass}
                        defaultValue={eq.type}
                        onBlur={(e) => {
                          const type = e.target.value.trim();
                          if (type !== eq.type) void updateEquipment(eq, { type });
                        }}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        type="checkbox"
                        checked={eq.active}
                        onChange={(e) => void updateEquipment(eq, { active: e.target.checked })}
                      />
                    </td>
                    <td className={tdClass}>
                      <button type="button" className={btnDanger} onClick={() => void removeEquipment(eq)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
