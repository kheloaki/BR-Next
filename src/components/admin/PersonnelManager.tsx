"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { PersonnelCategorySelectWithAdd } from "@/components/admin/PersonnelCategorySelectWithAdd";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import type { AdminEmployee, PersonnelCategory } from "@/components/admin/operations-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  labelClass,
  moduleWrap,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminDataSheet } from "@/components/admin/ux/AdminDataSheet";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

export function PersonnelManager() {
  const toast = useAdminToast();
  const { projects, employees, loading: refLoading, refresh } = useOpsReferential();
  const [tab, setTab] = useState("personnel");
  const [categories, setCategories] = useState<PersonnelCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newEmpMatricule, setNewEmpMatricule] = useState("");
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpRole, setNewEmpRole] = useState("");
  const [newEmpProjectId, setNewEmpProjectId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const loadCategories = useCallback(async () => {
    setCatLoading(true);
    const res = await fetch("/api/admin/personnel-categories", { cache: "no-store" });
    if (res.ok) setCategories((await res.json()) as PersonnelCategory[]);
    setCatLoading(false);
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const loading = refLoading || catLoading;

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.matricule.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        (e.defaultProjectName || "").toLowerCase().includes(q),
    );
  }, [employees, search]);

  async function addEmployee() {
    if (!newEmpName.trim()) {
      toast.error("Indiquez le nom du collaborateur.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matricule: newEmpMatricule.trim(),
        name: newEmpName.trim(),
        role: newEmpRole.trim(),
        defaultProjectId: newEmpProjectId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Collaborateur ajouté.");
    setNewEmpMatricule("");
    setNewEmpName("");
    setNewEmpRole("");
    setNewEmpProjectId("");
    setAddOpen(false);
    await refresh();
  }

  async function updateEmployee(emp: AdminEmployee, patch: Partial<AdminEmployee>) {
    await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: emp.id,
        matricule: patch.matricule ?? emp.matricule,
        name: patch.name ?? emp.name,
        role: patch.role ?? emp.role,
        defaultProjectId:
          patch.defaultProjectId !== undefined ? patch.defaultProjectId : emp.defaultProjectId,
      }),
    });
    await refresh();
  }

  async function removeEmployee(emp: AdminEmployee) {
    if (!(await confirmDelete(emp.name))) return;
    const res = await fetch(`/api/admin/employees?id=${encodeURIComponent(emp.id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Collaborateur supprimé.");
    await refresh();
  }

  async function addCategory() {
    if (!newCategoryName.trim()) {
      toast.error("Indiquez un nom de poste.");
      return;
    }
    const res = await fetch("/api/admin/personnel-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Poste créé.");
    setNewCategoryName("");
    await loadCategories();
  }

  async function renameCategory(cat: PersonnelCategory, name: string) {
    if (!name.trim() || name === cat.name) return;
    const res = await fetch("/api/admin/personnel-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, name: name.trim() }),
    });
    if (!res.ok) toast.error(await readApiError(res));
    else {
      toast.success("Poste mis à jour.");
      await loadCategories();
      await refresh();
    }
  }

  async function removeCategory(cat: PersonnelCategory) {
    if (!(await confirmDelete(cat.name))) return;
    const res = await fetch(`/api/admin/personnel-categories?id=${encodeURIComponent(cat.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Poste supprimé.");
    await loadCategories();
    await refresh();
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Personnel"
        description="Collaborateurs, postes et affectations. Ajout rapide via fiche latérale depuis les autres modules."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setAddOpen(true)}>
            + Ajouter au personnel
          </button>
        }
      />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Collaborateurs", value: String(employees.length) },
            { label: "Postes", value: String(categories.length) },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "personnel", label: `Personnel (${employees.length})` },
          { id: "postes", label: `Postes (${categories.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <AdminLoading /> : null}

      {!loading && tab === "personnel" ? (
        <AdminInventoryCard
          title="Liste du personnel"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom, matricule, poste…"
        >
          {filteredEmployees.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              {search ? "Aucun résultat." : "Aucun collaborateur enregistré."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setAddOpen(true)}>
                Ajouter au personnel
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Matricule</th>
                  <th className={thClass}>Nom</th>
                  <th className={thClass}>Poste</th>
                  <th className={thClass}>Chantier défaut</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className={tdClass}>
                      <input
                        className={inputClass}
                        defaultValue={emp.matricule}
                        onBlur={(e) => {
                          if (e.target.value !== emp.matricule) {
                            void updateEmployee(emp, { matricule: e.target.value });
                          }
                        }}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        className={inputClass}
                        defaultValue={emp.name}
                        onBlur={(e) => {
                          const name = e.target.value.trim();
                          if (name && name !== emp.name) void updateEmployee(emp, { name });
                        }}
                      />
                    </td>
                    <td className={tdClass}>
                      <PersonnelCategorySelectWithAdd
                        categories={categories}
                        value={emp.role}
                        onChange={(role) => void updateEmployee(emp, { role })}
                        onCategoryAdded={(c) => setCategories((prev) => [...prev, c])}
                        allowEmpty
                        placeholder="Poste…"
                      />
                    </td>
                    <td className={tdClass}>
                      <ProjectSelect
                        projects={projects}
                        value={emp.defaultProjectId ?? ""}
                        onChange={(id) => {
                          void updateEmployee(emp, { defaultProjectId: id || null });
                        }}
                        allowEmpty
                      />
                    </td>
                    <td className={tdClass}>
                      <button type="button" className={btnDanger} onClick={() => void removeEmployee(emp)}>
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

      {!loading && tab === "postes" ? (
        <>
          <AdminFormCard
            title="Nouveau poste / fonction"
            footer={
              <button type="button" className={btnPrimary} onClick={() => void addCategory()}>
                Ajouter
              </button>
            }
          >
            <div className={`${formGridClass} max-w-md`}>
              <input
                className={inputClass}
                placeholder="Ex. Chauffeur, Mécanicien…"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
          </AdminFormCard>
          <AdminInventoryCard title="Postes enregistrés">
            {categories.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                Aucun poste — ajoutez-en un ou utilisez le bouton + dans les listes.
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={thClass}>Poste</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className={tdClass}>
                        <input
                          className={inputClass}
                          defaultValue={cat.name}
                          onBlur={(e) => void renameCategory(cat, e.target.value)}
                        />
                      </td>
                      <td className={tdClass}>
                        <button type="button" className={btnDanger} onClick={() => void removeCategory(cat)}>
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
        </>
      ) : null}

      <AdminDataSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Nouveau collaborateur"
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setAddOpen(false)}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void addEmployee()}>
              {saving ? "Enregistrement…" : "Ajouter au personnel"}
            </button>
          </>
        }
      >
        <div className={formGridClass}>
          <div>
            <p className={labelClass}>Matricule</p>
            <input
              className={`${inputClass} mt-1`}
              value={newEmpMatricule}
              onChange={(e) => setNewEmpMatricule(e.target.value)}
            />
          </div>
          <div>
            <p className={labelClass}>Nom & prénom *</p>
            <input
              className={`${inputClass} mt-1`}
              value={newEmpName}
              onChange={(e) => setNewEmpName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <PersonnelCategorySelectWithAdd
              label="Poste / fonction"
              categories={categories}
              value={newEmpRole}
              onChange={setNewEmpRole}
              onCategoryAdded={(c) => setCategories((prev) => [...prev, c])}
            />
          </div>
          <div className="sm:col-span-2">
            <p className={labelClass}>Chantier par défaut</p>
            <div className="mt-1">
              <ProjectSelect projects={projects} value={newEmpProjectId} onChange={setNewEmpProjectId} allowEmpty />
            </div>
          </div>
        </div>
      </AdminDataSheet>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
