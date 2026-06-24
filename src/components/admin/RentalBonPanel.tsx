"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import {
  EMPTY_BON_FORM,
  RentalBonContractForm,
  validateRentalBonForm,
  type RentalBonFormState,
} from "@/components/admin/RentalBonContractForm";
import { RentalStatusBadge } from "@/components/admin/StatusBadge";
import type {
  RentalContract,
  RentalMaterial,
  GasoilContact,
  RentalEquipmentStatus,
} from "@/components/admin/operations-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  filterBarClass,
  filterFieldWrap,
  filterInputClass,
  inputClass,
  labelClass,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { RentalBonsPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import type { AdminProject } from "@/components/admin/operations-types";
import { contractToBonForm, bonMatchesDateRange, bonMatchesMaterial, formatBonLocationDates, formatBonLocationMaterials } from "@/lib/admin/map-rental-material";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { enumToOptions, stringOptions, withEmptyOption } from "@/components/admin/searchable-options";
import { confirmDelete, readApiError } from "@/components/admin/ux/useAdminToast";

const RENTAL_STATUSES: RentalEquipmentStatus[] = ["active", "maintenance", "down"];
const RENTAL_STATUS_LABELS: Record<RentalEquipmentStatus, string> = {
  active: "Actif",
  maintenance: "Maintenance",
  down: "En panne",
};

function refOrPlate(r: RentalContract) {
  return r.reference || r.matricule || "—";
}

type Props = {
  toast: { success: (m: string) => void; error: (m: string) => void };
  materials: RentalMaterial[];
  projects: AdminProject[];
  gasoilContacts: GasoilContact[];
  onGasoilContactsChange: (contacts: GasoilContact[]) => void;
};

export function RentalBonPanel({
  toast,
  materials,
  projects,
  gasoilContacts,
  onGasoilContactsChange,
}: Props) {
  const [tab, setTab] = useState("list");
  const [rows, setRows] = useState<RentalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterMaterialId, setFilterMaterialId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RentalBonFormState>(EMPTY_BON_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/rentals", { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as RentalContract[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const projectName = (id: string | null) => {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.name ?? "—";
  };

  const ownerOptions = useMemo(() => {
    return [...new Set(rows.map((r) => r.ownerName.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [rows]);

  const driverOptions = useMemo(() => {
    return [...new Set(rows.map((r) => r.driverName.trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [rows]);

  const materialOptions = useMemo(() => {
    return [...materials].sort((a, b) => materialLabel(a).localeCompare(materialLabel(b), "fr"));
  }, [materials]);

  const hasActiveFilters =
    filterProjectId !== "" ||
    filterMaterialId !== "" ||
    filterStatus !== "" ||
    filterOwner !== "" ||
    filterDriver !== "" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  const filtered = useMemo(() => {
    let list = rows;
    if (filterProjectId) list = list.filter((r) => r.projectId === filterProjectId);
    if (filterMaterialId) list = list.filter((r) => bonMatchesMaterial(r, filterMaterialId));
    if (filterStatus) list = list.filter((r) => r.status === filterStatus);
    if (filterOwner) list = list.filter((r) => r.ownerName.trim() === filterOwner);
    if (filterDriver) list = list.filter((r) => r.driverName.trim() === filterDriver);
    if (filterDateFrom || filterDateTo) {
      list = list.filter((r) => bonMatchesDateRange(r, filterDateFrom, filterDateTo));
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.designation.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q) ||
        r.matricule.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.bonLocationNo.toLowerCase().includes(q) ||
        r.locataire.toLowerCase().includes(q) ||
        formatBonLocationDates(r).toLowerCase().includes(q) ||
        formatBonLocationMaterials(r, materials).toLowerCase().includes(q) ||
        projectName(r.projectId).toLowerCase().includes(q),
    );
  }, [
    rows,
    search,
    projects,
    filterProjectId,
    filterMaterialId,
    filterStatus,
    filterOwner,
    filterDriver,
    filterDateFrom,
    filterDateTo,
    materials,
  ]);

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
    setForm(contractToBonForm(r));
    setTab("new");
  }

  async function submit() {
    const err = validateRentalBonForm(form);
    if (err) {
      toast.error(err);
      return;
    }

    const driverName = form.driverName.trim();

    setSaving(true);
    const res = await fetch("/api/admin/rentals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId || undefined,
        bonLocationNo: form.bonLocationNo,
        projectId: form.projectId,
        locataire: form.locataire,
        ownerName: form.ownerName,
        driverContactId: form.driverContactId || null,
        driverName,
        lines: form.lines,
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

      {loading ? <RentalBonsPageSkeleton partial /> : null}

      {!loading && tab === "list" ? (
        <AdminInventoryCard
          title={`Registre des bons location${hasActiveFilters || search ? ` (${filtered.length})` : ""}`}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="N° bon, matériel, loueur, conducteur, chantier…"
          actions={
            <button type="button" className={btnPrimary} onClick={openCreate}>
              + Nouveau bon location
            </button>
          }
        >
          <div className={filterBarClass}>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Chantier</p>
              <div className="mt-1 w-full">
                <ProjectSelect
                  projects={projects}
                  value={filterProjectId}
                  onChange={setFilterProjectId}
                  allowEmpty
                  placeholder="Tous chantiers"
                  activeOnly={false}
                />
              </div>
            </div>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Matériel</p>
              <SearchableSelect
                options={withEmptyOption(
                  materialOptions.map((m) => ({
                    value: m.id,
                    label: materialLabel(m),
                    keywords: `${m.reference} ${m.matricule} ${m.designation}`,
                  })),
                  "Tout matériel",
                )}
                value={filterMaterialId}
                onChange={setFilterMaterialId}
                placeholder="Tout matériel"
                inputClassName={filterInputClass}
              />
            </div>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Statut</p>
              <SearchableEnumSelect
                options={withEmptyOption(enumToOptions(RENTAL_STATUS_LABELS), "Tous statuts")}
                value={filterStatus}
                onChange={setFilterStatus}
                placeholder="Tous statuts"
                inputClassName={filterInputClass}
              />
            </div>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Loueur</p>
              <SearchableSelect
                options={withEmptyOption(stringOptions(ownerOptions), "Tous loueurs")}
                value={filterOwner}
                onChange={setFilterOwner}
                placeholder="Tous loueurs"
                inputClassName={filterInputClass}
              />
            </div>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Conducteur</p>
              <SearchableSelect
                options={withEmptyOption(stringOptions(driverOptions), "Tous conducteurs")}
                value={filterDriver}
                onChange={setFilterDriver}
                placeholder="Tous conducteurs"
                inputClassName={filterInputClass}
              />
            </div>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Du</p>
              <input
                type="date"
                className={filterInputClass}
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Au</p>
              <input
                type="date"
                className={filterInputClass}
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                className={`${btnSecondary} w-full xl:w-auto`}
                onClick={() => {
                  setFilterProjectId("");
                  setFilterMaterialId("");
                  setFilterStatus("");
                  setFilterOwner("");
                  setFilterDriver("");
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
              {rows.length === 0
                ? "Aucun bon de location — créez un bon journalier lié à un chantier."
                : "Aucun bon ne correspond aux filtres sélectionnés."}
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={openCreate}>
                Nouveau bon location
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>N° bon</th>
                  <th className={thClass}>Date</th>
                  <th className={thClass}>Matériel</th>
                  <th className={thClass}>Lieu travaux</th>
                  <th className={thClass}>Loueur</th>
                  <th className={thClass}>Conducteur</th>
                  <th className={thClass}>Lignes</th>
                  <th className={thClass}>Total MAD</th>
                  <th className={thClass}>Statut</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.bonLocationNo} lines={1} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-xs`}>{formatBonLocationDates(r)}</td>
                    <td className={tdTextClass}>
                      <AdminTruncatedText text={formatBonLocationMaterials(r, materials)} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={projectName(r.projectId)} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.ownerName} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={r.driverName} lines={1} />
                    </td>
                    <td className={tdClass}>{r.bonLines.length || r.daysCount || "—"}</td>
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
          title={editId ? "Modifier le bon de location" : "Bon de location"}
          hint="Bon journalier — lieu de travaux, lignes date / usage / tarif (1 jr = 9 h)."
          footer={
            <div className="flex flex-wrap items-center gap-3">
              <div className={filterFieldWrap}>
                <p className={labelClass}>Statut</p>
                <SearchableEnumSelect
                  options={RENTAL_STATUS_LABELS}
                  value={form.status}
                  onChange={(status) =>
                    setForm((f) => ({ ...f, status: status as RentalBonFormState["status"] }))
                  }
                  allowEmpty={false}
                  inputClassName={filterInputClass}
                />
              </div>
              <div className="flex flex-1 flex-wrap justify-end gap-2">
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
            </div>
          }
        >
          <RentalBonContractForm
            form={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            materials={materials}
            projects={projects}
            gasoilContacts={gasoilContacts}
            onGasoilContactAdded={(contact) =>
              onGasoilContactsChange(
                gasoilContacts.some((c) => c.id === contact.id) ? gasoilContacts : [...gasoilContacts, contact],
              )
            }
          />
        </AdminFormCard>
      ) : null}
    </div>
  );
}
