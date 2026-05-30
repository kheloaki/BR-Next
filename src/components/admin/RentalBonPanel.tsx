"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { EmployeeSelectWithAdd } from "@/components/admin/EmployeeSelectWithAdd";
import { MaterialSelect } from "@/components/admin/MaterialSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { RentalStatusBadge } from "@/components/admin/StatusBadge";
import type {
  MaterialTransportMode,
  PersonnelCategory,
  RentalContract,
  RentalEquipmentStatus,
  RentalMaterial,
} from "@/components/admin/operations-types";
import {
  MATERIAL_CATEGORY_LABELS,
  RENTAL_HOURS_PER_DAY,
} from "@/components/admin/operations-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  labelClass,
  rowHover,
  tdClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";
import type { AdminProject, AdminEmployee } from "@/components/admin/operations-types";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";

const EMPTY_BON_FORM = {
  bonLocationNo: "",
  materialId: "",
  projectId: "",
  employeeId: "",
  driverName: "",
  dailyRate: 0,
  daysCount: 0,
  transportMode: "" as MaterialTransportMode,
  transportPrice: 0,
  status: "active" as RentalEquipmentStatus,
};

function refOrPlate(r: RentalContract) {
  return r.reference || r.matricule || "—";
}

type Props = {
  toast: { success: (m: string) => void; error: (m: string) => void };
  materials: RentalMaterial[];
  projects: AdminProject[];
  employees: AdminEmployee[];
  personnelCategories: PersonnelCategory[];
  onPersonnelCategoriesChange: (cats: PersonnelCategory[]) => void;
  onEmployeesRefresh: () => Promise<void>;
};

export function RentalBonPanel({
  toast,
  materials,
  projects,
  employees,
  personnelCategories,
  onPersonnelCategoriesChange,
  onEmployeesRefresh,
}: Props) {
  const [tab, setTab] = useState("list");
  const [rows, setRows] = useState<RentalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_BON_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/rentals", { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as RentalContract[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedMaterial = materials.find((m) => m.id === form.materialId) ?? null;
  const materialCategory = selectedMaterial?.materialCategory;

  const estimatedHours = form.daysCount * RENTAL_HOURS_PER_DAY;
  const rentalSubtotal = form.dailyRate * form.daysCount;
  const transportTotal = form.transportMode === "depart" ? form.transportPrice : 0;
  const previewTotal = rentalSubtotal + transportTotal;

  const projectName = (id: string | null) => {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.name ?? "—";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.designation.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.matricule.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.bonLocationNo.toLowerCase().includes(q),
    );
  }, [rows, search]);

  function patchForm(patch: Partial<typeof EMPTY_BON_FORM>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function resetForm() {
    setEditId(null);
    setForm(EMPTY_BON_FORM);
  }

  function openCreate() {
    resetForm();
    setTab("new");
  }

  function openEdit(r: RentalContract) {
    setEditId(r.id);
    setForm({
      bonLocationNo: r.bonLocationNo,
      materialId: r.materialId ?? "",
      projectId: r.projectId ?? "",
      employeeId: r.employeeId ?? "",
      driverName: r.driverName,
      dailyRate: r.dailyRate,
      daysCount: r.daysCount,
      transportMode: r.transportMode,
      transportPrice: r.transportPrice,
      status: r.status,
    });
    setTab("new");
  }

  async function submit() {
    if (!form.materialId) {
      toast.error("Sélectionnez un matériel du catalogue.");
      return;
    }
    if (form.dailyRate <= 0 || form.daysCount <= 0) {
      toast.error("Indiquez le tarif journalier et le nombre de jours.");
      return;
    }
    if (
      materialCategory === "voiture" &&
      !form.employeeId &&
      !form.driverName.trim()
    ) {
      toast.error("Sélectionnez un chauffeur (personnel).");
      return;
    }

    const driverName =
      materialCategory === "voiture" && form.employeeId
        ? employees.find((e) => e.id === form.employeeId)?.name || form.driverName
        : form.driverName;

    setSaving(true);
    const res = await fetch("/api/admin/rentals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId || undefined,
        materialId: form.materialId,
        projectId: form.projectId || undefined,
        bonLocationNo: form.bonLocationNo,
        employeeId: form.employeeId || null,
        driverName,
        dailyRate: form.dailyRate,
        daysCount: form.daysCount,
        transportMode: form.transportMode,
        transportPrice: form.transportPrice,
        status: form.status,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    const saved = (await res.json()) as RentalContract;
    toast.success(
      editId
        ? `Bon location mis à jour${saved.bonLocationNo ? ` — ${saved.bonLocationNo}` : ""}.`
        : `Bon location enregistré${saved.bonLocationNo ? ` — ${saved.bonLocationNo}` : ""}.`,
    );
    resetForm();
    await load();
    setTab("list");
  }

  async function remove(r: RentalContract) {
    if (!(await confirmDelete(r.bonLocationNo || r.designation || refOrPlate(r)))) return;
    setSaving(true);
    const res = await fetch(`/api/admin/rentals?id=${encodeURIComponent(r.id)}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Bon location supprimé.");
    if (editId === r.id) resetForm();
    await load();
  }

  const showTransport = materialCategory === "engin";
  const chauffeurIsPersonnel = materialCategory === "voiture";

  return (
    <div className="space-y-4">
      <AdminTabs
        tabs={[
          { id: "list", label: "Bons location", badge: rows.length || undefined },
          { id: "new", label: editId ? "Modifier bon" : "Nouveau bon location" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <AdminLoading /> : null}

      {!loading && tab === "list" ? (
        <AdminInventoryCard
          title="Registre des bons location"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="N° bon, désignation, matricule…"
          actions={
            <button type="button" className={btnPrimary} onClick={openCreate}>
              + Nouveau bon location
            </button>
          }
        >
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              Aucun bon location — créez d&apos;abord un matériel dans l&apos;onglet Matériel.
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={openCreate}>
                Nouveau bon location
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>N° bon</th>
                  <th className={thClass}>Matériel</th>
                  <th className={thClass}>Chantier</th>
                  <th className={thClass}>Chauffeur</th>
                  <th className={thClass}>Tarif/jr</th>
                  <th className={thClass}>Jr</th>
                  <th className={thClass}>Total MAD</th>
                  <th className={thClass}>Statut</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={`${tdClass} font-mono text-xs`}>{r.bonLocationNo || "—"}</td>
                    <td className={tdClass}>
                      <span className="text-xs text-[var(--graphite)]/70">
                        {MATERIAL_CATEGORY_LABELS[r.materialCategory]}
                      </span>
                      <br />
                      {r.designation || refOrPlate(r)}
                    </td>
                    <td className={tdClass}>{projectName(r.projectId)}</td>
                    <td className={tdClass}>{r.driverName || "—"}</td>
                    <td className={tdClass}>{r.dailyRate.toLocaleString("fr-MA")}</td>
                    <td className={tdClass}>{r.daysCount}</td>
                    <td className={tdClass}>{r.totalMad.toLocaleString("fr-MA")}</td>
                    <td className={tdClass}>
                      <RentalStatusBadge status={r.status} />
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" className={btnSecondary} onClick={() => openEdit(r)}>
                          Modif.
                        </button>
                        <button type="button" className={btnDanger} onClick={() => void remove(r)}>
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
          title={editId ? "Modifier le bon location" : "Nouveau bon location"}
          hint="Sélectionnez un matériel du catalogue · N° bon auto BL-2026-001 si vide · 1 jr = 9 h."
          footer={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  resetForm();
                  setTab("list");
                }}
              >
                Annuler
              </button>
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
                {saving ? "Enregistrement…" : editId ? "Enregistrer" : "Enregistrer le bon location"}
              </button>
            </div>
          }
        >
          <div className={`${formGridClass} max-w-3xl`}>
            <div className="sm:col-span-2">
              <p className={labelClass}>N° bon location</p>
              <input
                className={`${inputClass} mt-1`}
                placeholder="Auto BL-2026-001"
                value={form.bonLocationNo}
                onChange={(e) => patchForm({ bonLocationNo: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <MaterialSelect
                materials={materials}
                value={form.materialId}
                onChange={(id) => patchForm({ materialId: id })}
              />
            </div>

            {selectedMaterial ? (
              <div className="sm:col-span-2 rounded-md border border-border bg-[#fafafa] px-4 py-3 text-sm">
                <p className="font-medium text-[var(--navy)]">{materialLabel(selectedMaterial)}</p>
                <p className="mt-1 text-[var(--graphite)]/80">
                  {MATERIAL_CATEGORY_LABELS[selectedMaterial.materialCategory]}
                  {selectedMaterial.subCategory ? ` · ${selectedMaterial.subCategory}` : ""}
                  {selectedMaterial.ownerName ? ` · ${selectedMaterial.ownerName}` : ""}
                </p>
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <p className={labelClass}>Chantier</p>
              <div className="mt-1">
                <ProjectSelect
                  projects={projects}
                  value={form.projectId}
                  onChange={(id) => patchForm({ projectId: id })}
                  allowEmpty
                />
              </div>
            </div>

            {chauffeurIsPersonnel ? (
              <div className="sm:col-span-2">
                <EmployeeSelectWithAdd
                  label="Chauffeur (personnel) *"
                  employees={employees}
                  categories={personnelCategories}
                  projects={projects}
                  value={form.employeeId}
                  onChange={(id) => patchForm({ employeeId: id })}
                  onEmployeeAdded={onEmployeesRefresh}
                  onCategoriesChange={onPersonnelCategoriesChange}
                />
              </div>
            ) : materialCategory ? (
              <div>
                <p className={labelClass}>Chauffeur</p>
                <input
                  className={`${inputClass} mt-1`}
                  value={form.driverName}
                  onChange={(e) => patchForm({ driverName: e.target.value })}
                />
              </div>
            ) : null}

            <div>
              <p className={labelClass}>Prix location / jr (MAD) *</p>
              <input
                type="number"
                min={0}
                step="0.01"
                className={`${inputClass} mt-1`}
                value={form.dailyRate || ""}
                onChange={(e) => patchForm({ dailyRate: Number(e.target.value) || 0 })}
              />
              <p className="mt-1 text-xs text-[var(--graphite)]/70">1 jr = {RENTAL_HOURS_PER_DAY} h</p>
            </div>

            <div>
              <p className={labelClass}>Nombre de jr *</p>
              <input
                type="number"
                min={0}
                step="0.5"
                className={`${inputClass} mt-1`}
                value={form.daysCount || ""}
                onChange={(e) => patchForm({ daysCount: Number(e.target.value) || 0 })}
              />
            </div>

            {showTransport ? (
              <>
                <div>
                  <p className={labelClass}>Transport</p>
                  <select
                    className={`${inputClass} mt-1`}
                    value={form.transportMode}
                    onChange={(e) =>
                      patchForm({
                        transportMode: e.target.value as MaterialTransportMode,
                        transportPrice: e.target.value === "depart" ? form.transportPrice : 0,
                      })
                    }
                  >
                    <option value="">—</option>
                    <option value="rendre">Rendre sur chantier</option>
                    <option value="depart">Départ (frais transport)</option>
                  </select>
                </div>
                {form.transportMode === "depart" ? (
                  <div>
                    <p className={labelClass}>Prix transport (MAD)</p>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${inputClass} mt-1`}
                      value={form.transportPrice || ""}
                      onChange={(e) => patchForm({ transportPrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                ) : null}
              </>
            ) : null}

            <div>
              <p className={labelClass}>Statut</p>
              <select
                className={`${inputClass} mt-1`}
                value={form.status}
                onChange={(e) => patchForm({ status: e.target.value as RentalEquipmentStatus })}
              >
                <option value="active">Actif</option>
                <option value="maintenance">Maintenance</option>
                <option value="down">En panne</option>
              </select>
            </div>

            <p className="sm:col-span-2 text-sm text-[var(--navy)]">
              Heures estimées : <strong>{estimatedHours} h</strong>
              {" · "}
              Location : <strong>{rentalSubtotal.toLocaleString("fr-MA")} MAD</strong>
              {transportTotal > 0 ? (
                <>
                  {" · "}
                  Transport : <strong>{transportTotal.toLocaleString("fr-MA")} MAD</strong>
                </>
              ) : null}
              {" · "}
              Total estimé : <strong>{previewTotal.toLocaleString("fr-MA")} MAD</strong>
            </p>
          </div>
        </AdminFormCard>
      ) : null}
    </div>
  );
}
