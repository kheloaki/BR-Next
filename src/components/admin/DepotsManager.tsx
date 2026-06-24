"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DepotSelect } from "@/components/admin/DepotSelect";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { useOpsReferential } from "@/components/admin/useOpsReferential";
import {
  DEPOT_TYPE_LABELS,
  type AdminDepot,
  type DepotType,
} from "@/components/admin/operations-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { DepotsPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

const TYPES: DepotType[] = ["central", "site", "other"];

export function DepotsManager() {
  const toast = useAdminToast();
  const { projects, refresh: refreshRef } = useOpsReferential();
  const [rows, setRows] = useState<AdminDepot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [depotType, setDepotType] = useState<DepotType>("central");
  const [projectId, setProjectId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/depots", { cache: "no-store" });
    if (res.ok) setRows((await res.json()) as AdminDepot[]);
    await refreshRef();
    setLoading(false);
  }, [refreshRef]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        (d.projectName || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const depotTypeOptions = useMemo(
    () => Object.fromEntries(TYPES.map((t) => [t, DEPOT_TYPE_LABELS[t]])),
    [],
  );

  function resetForm() {
    setEditId(null);
    setName("");
    setAddress("");
    setDepotType("central");
    setProjectId("");
  }

  function openEdit(d: AdminDepot) {
    setEditId(d.id);
    setName(d.name);
    setAddress(d.address);
    setDepotType(d.depotType);
    setProjectId(d.projectId ?? "");
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Nom du dépôt requis.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/depots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId ?? undefined,
        name,
        address,
        depotType,
        projectId: projectId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editId ? "Dépôt mis à jour." : "Dépôt créé.");
    resetForm();
    await load();
  }

  async function remove(d: AdminDepot) {
    if (!(await confirmDelete(d.name))) return;
    const res = await fetch(`/api/admin/depots?id=${encodeURIComponent(d.id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Dépôt supprimé.");
    await load();
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Dépôts"
        description="Entrepôts et magasins — distincts des projets chantier. Utilisés pour les mouvements de stock."
        actions={
          <button type="button" className={btnPrimary} onClick={resetForm}>
            Nouveau dépôt
          </button>
        }
      />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Dépôts", value: String(rows.length) },
            { label: "Central", value: String(rows.filter((d) => d.depotType === "central").length) },
            { label: "Sur chantier", value: String(rows.filter((d) => d.depotType === "site").length) },
          ]}
        />
      ) : null}

      {loading ? <DepotsPageSkeleton partial /> : null}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
        <div>
          <AdminInventoryCard
            title="Liste des dépôts"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Nom, adresse…"
          >
          {filtered.length === 0 && !loading ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
              Aucun dépôt enregistré.
              <button type="button" className={`mt-4 ${btnPrimary}`} onClick={resetForm}>
                Nouveau dépôt
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <th className={thClass}>Nom</th>
                  <th className={thClass}>Type</th>
                  <th className={thClass}>Projet</th>
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className={rowHover}>
                    <td className={tdClass}>
                      <AdminTruncatedText text={d.name} lines={1} />
                    </td>
                    <td className={tdClass}>{DEPOT_TYPE_LABELS[d.depotType]}</td>
                    <td className={tdClass}>
                      <AdminTruncatedText text={d.projectName} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <div className="flex gap-2 justify-end">
                        <button type="button" className="text-xs hover:underline" onClick={() => openEdit(d)}>
                          Modifier
                        </button>
                        <button type="button" className={btnDanger} onClick={() => void remove(d)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
          </AdminInventoryCard>
        </div>

        <AdminFormCard
          title={editId ? "Modifier le dépôt" : "Nouveau dépôt"}
          footer={
            <div className="flex gap-2">
              {editId ? (
                <button type="button" className={btnSecondary} onClick={resetForm}>
                  Annuler
                </button>
              ) : null}
              <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
                {saving ? "…" : "Enregistrer"}
              </button>
            </div>
          }
        >
          <div className="space-y-2">
            <input className={inputClass} placeholder="Nom *" value={name} onChange={(e) => setName(e.target.value)} />
            <input
              className={inputClass}
              placeholder="Adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <SearchableEnumSelect
              options={depotTypeOptions}
              value={depotType}
              onChange={(v) => setDepotType(v as DepotType)}
              inputClassName={inputClass}
              allowEmpty={false}
            />
            <ProjectSelect
              projects={projects}
              value={projectId}
              onChange={setProjectId}
              placeholder="Projet lié (optionnel)"
              activeOnly={false}
            />
          </div>
        </AdminFormCard>
      </div>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
