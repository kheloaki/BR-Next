"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  EMPTY_GASOIL_BON_FORM,
  FuelGasoilBonForm,
  gasoilBonNotesFromForm,
  gasoilBonRowToForm,
  validateGasoilBonForm,
  type GasoilBonFormState,
} from "@/components/admin/FuelGasoilBonForm";
import type {
  AdminProject,
  GasoilBon,
  GasoilBonType,
  GasoilContact,
  GasoilVehicleCategory,
  RentalMaterial,
  StockItem,
} from "@/components/admin/operations-types";
import type { Supplier } from "@/components/admin/devis-types";
import type { GasoilUnitPriceInfo } from "@/lib/admin/gasoil-unit-price";
import { FrenchDateInput } from "@/components/admin/FrenchDateTimeInput";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableEnumSelect } from "@/components/admin/SearchableEnumSelect";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { enumToOptions, stringOptions, withEmptyOption } from "@/components/admin/searchable-options";
import { formatDateFr, formatTimeFr24 } from "@/lib/admin/date-time-fr";
import {
  applyFacetScope,
  facetEnumOptions,
  facetStringOptions,
  projectsForFacetScope,
  pruneFilterValue,
  pruneProjectId,
} from "@/lib/admin/filter-scope";
import { appendExportFormat } from "@/lib/admin/admin-csv-export";
import {
  filterGasoilBons,
  gasoilBonExportBasePath,
  gasoilBonListFiltersFromPanelState,
} from "@/lib/admin/gasoil-bon-list-filters";
import { GASOIL_VEHICLE_CATEGORIES, GASOIL_VEHICLE_CATEGORY_LABELS } from "@/lib/admin/gasoil-bon";
import { assertBonSerieNoAvailable } from "@/lib/admin/bon-number-duplicate";
import { formatBonLocationNo } from "@/lib/admin/rental-bon-number-format";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  filterBarClass,
  filterFieldWrap,
  filterInputClass,
  rowHover,
  tdClass,
  thClass,
  labelClass,
} from "@/components/admin/admin-form-styles";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { useTableSort } from "@/components/admin/ux/useTableSort";
import { FuelBonsPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { confirmDelete, readApiError, useAdminToast, alertDialog } from "@/components/admin/ux/useAdminToast";
import { useAdminListFormNav } from "@/components/admin/ux/useAdminListFormNav";

type PanelTab = "list" | "form";

export function FuelGasoilBonPanel({
  projects,
  materials,
  projectIdFromUrl,
  onStockUpdated,
  fixedBonType,
}: {
  projects: AdminProject[];
  materials: RentalMaterial[];
  projectIdFromUrl?: string;
  onStockUpdated?: () => void;
  fixedBonType: GasoilBonType;
}) {
  const isCommande = fixedBonType === "achat";
  const listTitle = isCommande ? "Bons de commande gasoil" : "Bons de sortie gasoil";
  const newLabel = isCommande ? "Nouveau bon de commande" : "Nouveau bon de sortie";
  const saveLabel = isCommande ? "Enregistrer la commande" : "Enregistrer le bon";
  const toast = useAdminToast();
  const pathname = usePathname();
  const [rows, setRows] = useState<GasoilBon[]>([]);
  const [gasoilStock, setGasoilStock] = useState<StockItem | null>(null);
  const [avgUnitPriceInfo, setAvgUnitPriceInfo] = useState<GasoilUnitPriceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    tab: panelTab,
    editingId,
    returnToList,
    openFormNew,
    openFormEdit,
  } = useAdminListFormNav({ pathname, loading, formTabId: "form" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterPerson, setFilterPerson] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [form, setForm] = useState<GasoilBonFormState>({
    ...EMPTY_GASOIL_BON_FORM,
    bonType: fixedBonType,
  });
  const [gasoilContacts, setGasoilContacts] = useState<GasoilContact[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("bonType", fixedBonType);
    const qs = params.toString();
    const supplierFetch = isCommande
      ? fetch("/api/admin/suppliers?supplyType=gasoil", { cache: "no-store" })
      : Promise.resolve(null);
    const [bonRes, stockRes, contactsRes, suppliersRes] = await Promise.all([
      fetch(`/api/admin/fuel/bons${qs ? `?${qs}` : ""}`, { cache: "no-store" }),
      fetch("/api/admin/fuel/stock", { cache: "no-store" }),
      fetch("/api/admin/gasoil-contacts", { cache: "no-store" }),
      supplierFetch,
    ]);
    if (bonRes.ok) setRows((await bonRes.json()) as GasoilBon[]);
    if (stockRes.ok) {
      const data = (await stockRes.json()) as {
        item: StockItem | null;
        unitPriceInfo?: GasoilUnitPriceInfo;
      };
      setGasoilStock(data.item);
      setAvgUnitPriceInfo(data.unitPriceInfo ?? null);
    }
    if (contactsRes.ok) setGasoilContacts((await contactsRes.json()) as GasoilContact[]);
    if (suppliersRes?.ok) setSuppliers((await suppliersRes.json()) as Supplier[]);
    setLoading(false);
  }, [fixedBonType, isCommande]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (projectIdFromUrl) setForm((f) => ({ ...f, projectId: projectIdFromUrl }));
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (!editingId || loading || panelTab !== "form") return;
    const row = rows.find((r) => r.id === editingId);
    if (row && !row.traitementId) setForm(gasoilBonRowToForm(row));
  }, [editingId, rows, loading, panelTab]);

  const projectName = (id: string | null) => {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.name ?? "—";
  };

  const gasoilFacetChecks = useMemo(
    () => [
      {
        key: "projectId",
        active: filterProjectId,
        test: (r: GasoilBon) => r.projectId === filterProjectId,
      },
      ...(!isCommande
        ? [
            {
              key: "category",
              active: filterCategory,
              test: (r: GasoilBon) => r.vehicleCategory === filterCategory,
            },
            {
              key: "material",
              active: filterMaterial,
              test: (r: GasoilBon) =>
                (r.equipmentName.trim() || r.vehicleLabel.trim()) === filterMaterial,
            },
          ]
        : []),
      {
        key: "person",
        active: filterPerson,
        test: (r: GasoilBon) => (isCommande ? r.supplier : r.beneficiary).trim() === filterPerson,
      },
      {
        key: "dates",
        active: filterDateFrom || filterDateTo ? "1" : "",
        test: (r: GasoilBon) => {
          const d = r.bonDate.slice(0, 10);
          if (filterDateFrom && d < filterDateFrom) return false;
          if (filterDateTo && d > filterDateTo) return false;
          return true;
        },
      },
    ],
    [filterProjectId, filterCategory, filterMaterial, filterPerson, filterDateFrom, filterDateTo, isCommande],
  );

  const scopeFor = useCallback(
    (excludeKey: string) => applyFacetScope(rows, gasoilFacetChecks, excludeKey),
    [rows, gasoilFacetChecks],
  );

  const filterProjects = useMemo(
    () => projectsForFacetScope(projects, scopeFor("projectId")),
    [projects, scopeFor],
  );

  const materialOptions = useMemo(
    () =>
      facetStringOptions(
        scopeFor("material"),
        rows.length,
        (r) => r.equipmentName.trim() || r.vehicleLabel.trim(),
      ),
    [scopeFor, rows.length],
  );

  const personOptions = useMemo(
    () =>
      facetStringOptions(
        scopeFor("person"),
        rows.length,
        (r) => (isCommande ? r.supplier : r.beneficiary),
      ),
    [scopeFor, rows.length, isCommande],
  );

  const categoryOptions = useMemo(
    () =>
      facetEnumOptions(
        GASOIL_VEHICLE_CATEGORIES,
        scopeFor("category"),
        rows.length,
        (r) => r.vehicleCategory ?? null,
      ),
    [scopeFor, rows.length],
  );

  const categoryLabelOptions = useMemo(() => {
    const labels: Partial<Record<(typeof GASOIL_VEHICLE_CATEGORIES)[number], string>> = {};
    for (const category of categoryOptions) labels[category] = GASOIL_VEHICLE_CATEGORY_LABELS[category];
    return labels as Record<(typeof GASOIL_VEHICLE_CATEGORIES)[number], string>;
  }, [categoryOptions]);

  useEffect(() => {
    setFilterProjectId((current) => pruneProjectId(current, filterProjects));
    setFilterMaterial((current) => pruneFilterValue(current, materialOptions));
    setFilterPerson((current) => pruneFilterValue(current, personOptions));
    setFilterCategory((current) => pruneFilterValue(current, categoryOptions));
  }, [filterProjects, materialOptions, personOptions, categoryOptions]);

  const hasActiveFilters =
    filterProjectId !== "" ||
    filterCategory !== "" ||
    filterMaterial !== "" ||
    filterPerson !== "" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  const filtered = useMemo(() => {
    return filterGasoilBons(
      rows,
      gasoilBonListFiltersFromPanelState({
        fixedBonType,
        filterProjectId,
        filterCategory,
        filterMaterial,
        filterPerson,
        filterDateFrom,
        filterDateTo,
        search,
      }),
      { isCommande, projectName },
    );
  }, [
    rows,
    fixedBonType,
    filterProjectId,
    filterCategory,
    filterMaterial,
    filterPerson,
    filterDateFrom,
    filterDateTo,
    search,
    isCommande,
    projects,
  ]);

  const listExportHref = useMemo(() => {
    return gasoilBonExportBasePath(
      gasoilBonListFiltersFromPanelState({
        fixedBonType,
        filterProjectId,
        filterCategory,
        filterMaterial,
        filterPerson,
        filterDateFrom,
        filterDateTo,
        search,
      }),
    );
  }, [
    fixedBonType,
    filterProjectId,
    filterCategory,
    filterMaterial,
    filterPerson,
    filterDateFrom,
    filterDateTo,
    search,
  ]);

  const filteredTotals = useMemo(() => {
    let litres = 0;
    let mad = 0;
    for (const row of filtered) {
      litres += row.litres;
      const amount =
        row.totalAmount ??
        (row.unitPrice && row.unitPrice > 0 ? row.litres * row.unitPrice : 0);
      mad += amount;
    }
    return { litres, mad, count: filtered.length };
  }, [filtered]);

  const { sort, onSort, applySort } = useTableSort("date", "desc");

  const sortAccessors = useMemo(
    () => ({
      number: (r: GasoilBon) => r.number,
      category: (r: GasoilBon) => GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory],
      project: (r: GasoilBon) => projectName(r.projectId),
      vehicle: (r: GasoilBon) => r.equipmentName || r.vehicleLabel,
      litres: (r: GasoilBon) => r.litres,
      unitPrice: (r: GasoilBon) => r.unitPrice ?? 0,
      pumpMeter: (r: GasoilBon) => r.pumpMeter ?? 0,
      fuelTime: (r: GasoilBon) => r.fuelTime,
      person: (r: GasoilBon) => (isCommande ? r.supplier : r.beneficiary),
      date: (r: GasoilBon) => r.bonDate.slice(0, 10),
    }),
    [projects, isCommande],
  );

  const sortedRows = useMemo(
    () => applySort(filtered, sortAccessors),
    [filtered, applySort, sortAccessors],
  );

  const fetchNextBonNumber = useCallback(async () => {
    const params = new URLSearchParams({ next: "1", bonType: fixedBonType });
    const res = await fetch(`/api/admin/fuel/bons?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return "";
    const data = (await res.json()) as { number?: string };
    return data.number ?? "";
  }, [fixedBonType]);

  async function resetForm() {
    const bonNumber = await fetchNextBonNumber();
    const avgPrice = avgUnitPriceInfo?.unitPricePerLitre ?? 0;
    const stockPrice = gasoilStock?.unitPrice ?? 0;
    const defaultPrice = isCommande ? stockPrice : avgPrice > 0 ? avgPrice : stockPrice;
    setForm({
      ...EMPTY_GASOIL_BON_FORM,
      bonType: fixedBonType,
      projectId: projectIdFromUrl ?? "",
      bonNumber,
      unitPricePerLitre: defaultPrice > 0 ? defaultPrice : "",
    });
  }

  async function openNew() {
    await resetForm();
    openFormNew();
  }

  function openEdit(row: GasoilBon) {
    if (row.traitementId) {
      toast.error("Ce bon est lié à un traitement. Modifiez-le depuis Traitements.");
      return;
    }
    setForm(gasoilBonRowToForm(row));
    openFormEdit(row.id);
  }

  async function submitBon() {
    const err = validateGasoilBonForm(form);
    if (err) {
      toast.error(err);
      return;
    }

    if (!isCommande) {
      const providedNo = formatBonLocationNo(form.bonNumber);
      if (providedNo) {
        const duplicateMsg = assertBonSerieNoAvailable(
          rows.map((r) => ({ id: r.id, number: r.number })),
          providedNo,
          editingId ?? undefined,
        );
        if (duplicateMsg) {
          await alertDialog(duplicateMsg, { title: "N° bon déjà utilisé" });
          return;
        }
      }
    }

    const L = typeof form.litres === "number" ? form.litres : Number(form.litres);

    setSaving(true);
    const payload = {
      number: form.bonNumber || undefined,
      bonType: fixedBonType,
      vehicleCategory: isCommande ? "engin" : form.vehicleCategory,
      projectId: form.projectId,
      materialId: isCommande ? undefined : form.materialId || undefined,
      vehicleLabel: isCommande ? "" : form.vehicleLabel,
      bonDate: form.bonDate,
      litres: L,
      pumpMeter: form.pumpMeter.trim() ? Number(form.pumpMeter) : null,
      supplier: isCommande ? form.supplier : form.pumpAttendant,
      beneficiary: isCommande ? "" : form.driverName,
      driverContactId: isCommande ? undefined : form.driverContactId || undefined,
      pompisteContactId: isCommande ? undefined : form.pompisteContactId || undefined,
      fuelTime: isCommande ? "" : form.fuelTime,
      deliveryNote: "",
      notes: gasoilBonNotesFromForm(form),
      syncStock: form.syncStock,
      unitPricePerLitre:
        typeof form.unitPricePerLitre === "number" && form.unitPricePerLitre > 0
          ? form.unitPricePerLitre
          : undefined,
    };

    const res = await fetch("/api/admin/fuel/bons", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
    });
    setSaving(false);
    if (!res.ok) {
      const apiErr = await readApiError(res);
      if (res.status === 409) {
        await alertDialog(apiErr, { title: "N° bon déjà utilisé" });
        return;
      }
      toast.error(apiErr);
      return;
    }
    const saved = (await res.json()) as GasoilBon;
    toast.success(
      editingId
        ? `${isCommande ? "Bon de commande" : "Bon de sortie"} N° ${saved.number} mis à jour.`
        : `${isCommande ? "Bon de commande" : "Bon de sortie"} — N° ${saved.number}`,
    );
    await resetForm();
    await load();
    onStockUpdated?.();
    returnToList();
  }

  async function remove(row: GasoilBon) {
    if (!(await confirmDelete(row.number))) return;
    const res = await fetch(`/api/admin/fuel/bons?id=${encodeURIComponent(row.id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Bon supprimé.");
    await load();
  }

  function exportBon(row: GasoilBon, format: "pdf" | "excel") {
    const url = `/api/admin/fuel/bons/export?id=${encodeURIComponent(row.id)}&format=${format}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (loading) return <FuelBonsPageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-[var(--background)] px-3 py-2 text-sm">
        <span className="text-[var(--graphite)]/70">Stock gasoil :</span>
        <span className="font-medium text-[var(--navy)]">
          {gasoilStock ? `${gasoilStock.qty.toLocaleString("fr-MA")} L` : "Non configuré"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={panelTab === "list" ? btnPrimary : btnSecondary}
          onClick={() => {
            resetForm();
            returnToList();
          }}
        >
          Liste des bons
        </button>
        <button type="button" className={panelTab === "form" ? btnPrimary : btnSecondary} onClick={openNew}>
          {newLabel}
        </button>
      </div>

      {panelTab === "list" ? (
        <AdminInventoryCard
          title={`${listTitle}${hasActiveFilters || search ? ` (${filtered.length})` : ""}`}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={
            isCommande
              ? "N° document, chantier, fournisseur…"
              : "N° bon, matériel, chantier, conducteur…"
          }
          actions={
            <>
              <a href={appendExportFormat(listExportHref, "csv")} className={btnSecondary}>
                CSV ({filtered.length})
              </a>
              <a href={appendExportFormat(listExportHref, "excel")} className={btnSecondary}>
                Excel ({filtered.length})
              </a>
              <button type="button" className={btnPrimary} onClick={openNew}>
                {isCommande ? "Nouvelle commande" : "Nouveau bon"}
              </button>
            </>
          }
        >
          <div className={filterBarClass}>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Chantier</p>
              <div className="mt-1">
                <ProjectSelect
                  projects={filterProjects}
                  value={filterProjectId}
                  onChange={setFilterProjectId}
                  allowEmpty
                  placeholder="Tous chantiers"
                  activeOnly={false}
                />
              </div>
            </div>
            {!isCommande ? (
              <div className={filterFieldWrap}>
                <p className={labelClass}>Catégorie</p>
                <SearchableEnumSelect
                  options={withEmptyOption(enumToOptions(categoryLabelOptions), "Toutes catégories")}
                  value={filterCategory}
                  onChange={setFilterCategory}
                  placeholder="Toutes catégories"
                  inputClassName={filterInputClass}
                />
              </div>
            ) : null}
            {!isCommande ? (
              <div className={filterFieldWrap}>
                <p className={labelClass}>Matériel</p>
                <SearchableSelect
                  options={withEmptyOption(stringOptions(materialOptions), "Tout matériel")}
                  value={filterMaterial}
                  onChange={setFilterMaterial}
                  placeholder="Tout matériel"
                  inputClassName={filterInputClass}
                />
              </div>
            ) : null}
            <div className={filterFieldWrap}>
              <p className={labelClass}>{isCommande ? "Fournisseur" : "Conducteur"}</p>
              <SearchableSelect
                options={withEmptyOption(
                  stringOptions(personOptions),
                  isCommande ? "Tous fournisseurs" : "Tous conducteurs",
                )}
                value={filterPerson}
                onChange={setFilterPerson}
                placeholder={isCommande ? "Tous fournisseurs" : "Tous conducteurs"}
                inputClassName={filterInputClass}
              />
            </div>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Du</p>
              <FrenchDateInput
                className={filterInputClass}
                value={filterDateFrom}
                onChange={setFilterDateFrom}
              />
            </div>
            <div className={filterFieldWrap}>
              <p className={labelClass}>Au</p>
              <FrenchDateInput
                className={filterInputClass}
                value={filterDateTo}
                onChange={setFilterDateTo}
              />
            </div>
            {hasActiveFilters ? (
              <button
                type="button"
                className={`${btnSecondary} w-full xl:w-auto`}
                onClick={() => {
                  setFilterProjectId("");
                  setFilterCategory("");
                  setFilterMaterial("");
                  setFilterPerson("");
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
                ? isCommande
                  ? "Aucun bon de commande gasoil."
                  : "Aucun bon de sortie gasoil."
                : "Aucun bon ne correspond aux filtres sélectionnés."}
              <button type="button" className={`mt-4 block mx-auto ${btnPrimary}`} onClick={openNew}>
                {isCommande ? "Créer une commande" : "Créer un bon"}
              </button>
            </div>
          ) : (
            <AdminTableWrap>
              <thead>
                <tr>
                  <AdminSortableTh
                    label={isCommande ? "N° document" : "N° bon"}
                    sortKey="number"
                    sort={sort}
                    onSort={onSort}
                  />
                  <AdminSortableTh label="Date" sortKey="date" sort={sort} onSort={onSort} />
                  {!isCommande ? (
                    <AdminSortableTh label="Catégorie" sortKey="category" sort={sort} onSort={onSort} />
                  ) : null}
                  <AdminSortableTh label="Chantier" sortKey="project" sort={sort} onSort={onSort} />
                  {!isCommande ? (
                    <AdminSortableTh label="Véhicule" sortKey="vehicle" sort={sort} onSort={onSort} />
                  ) : null}
                  <AdminSortableTh label="Litres" sortKey="litres" sort={sort} onSort={onSort} />
                  {!isCommande ? (
                    <AdminSortableTh label="Prix/L" sortKey="unitPrice" sort={sort} onSort={onSort} />
                  ) : null}
                  <AdminSortableTh label="Compteur" sortKey="pumpMeter" sort={sort} onSort={onSort} />
                  {!isCommande ? (
                    <AdminSortableTh label="Heure" sortKey="fuelTime" sort={sort} onSort={onSort} />
                  ) : null}
                  <AdminSortableTh
                    label={isCommande ? "Fournisseur" : "Conducteur"}
                    sortKey="person"
                    sort={sort}
                    onSort={onSort}
                  />
                  <th className={thClass} />
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr key={r.id} className={rowHover}>
                    <td className={`${tdClass} font-mono text-xs`}>{r.number}</td>
                    <td className={tdClass}>{formatDateFr(r.bonDate)}</td>
                    {!isCommande ? (
                      <td className={tdClass}>{GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory]}</td>
                    ) : null}
                    <td className={tdClass}>
                      <AdminTruncatedText text={projectName(r.projectId)} lines={1} />
                    </td>
                    {!isCommande ? (
                      <td className={tdClass}>
                        <AdminTruncatedText text={r.equipmentName || r.vehicleLabel} lines={1} />
                      </td>
                    ) : null}
                    <td className={tdClass}>{r.litres.toLocaleString("fr-MA")} L</td>
                    {!isCommande ? (
                      <td className={`${tdClass} tabular-nums`}>
                        {r.unitPrice && r.unitPrice > 0
                          ? `${r.unitPrice.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`
                          : "—"}
                      </td>
                    ) : null}
                    <td className={tdClass}>
                      {r.pumpMeter != null ? r.pumpMeter.toLocaleString("fr-MA") : "—"}
                    </td>
                    {!isCommande ? (
                      <td className={`${tdClass} tabular-nums`}>{formatTimeFr24(r.fuelTime)}</td>
                    ) : null}
                    <td className={tdClass}>
                      <AdminTruncatedText text={isCommande ? r.supplier : r.beneficiary} lines={1} />
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={`${btnSecondary} px-2 py-1 text-[10px]`}
                          onClick={() => openEdit(r)}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          className={`${btnSecondary} px-2 py-1 text-[10px]`}
                          onClick={() => exportBon(r, "pdf")}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          className={`${btnSecondary} px-2 py-1 text-[10px]`}
                          onClick={() => exportBon(r, "excel")}
                        >
                          Excel
                        </button>
                        <button type="button" className={btnDanger} onClick={() => void remove(r)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[var(--navy)]/20 bg-[var(--background)]/60 font-medium">
                  <td className={tdClass} colSpan={isCommande ? 3 : 5}>
                    Total ({filteredTotals.count} bon{filteredTotals.count > 1 ? "s" : ""})
                  </td>
                  <td className={`${tdClass} tabular-nums text-[var(--navy)]`}>
                    {filteredTotals.litres > 0
                      ? `${filteredTotals.litres.toLocaleString("fr-MA")} L`
                      : "—"}
                  </td>
                  {!isCommande ? (
                    <td className={`${tdClass} tabular-nums text-[var(--navy)]`}>
                      {filteredTotals.mad > 0 ? `${filteredTotals.mad.toLocaleString("fr-MA")} MAD` : "—"}
                    </td>
                  ) : null}
                  <td className={tdClass} colSpan={isCommande ? 3 : 4} />
                </tr>
              </tbody>
            </AdminTableWrap>
          )}
        </AdminInventoryCard>
      ) : null}

      {panelTab === "form" ? (
        <div className="space-y-4">
          <FuelGasoilBonForm
            form={form}
            onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            projects={projects}
            materials={materials}
            gasoilContacts={gasoilContacts}
            fixedBonType={fixedBonType}
            lockBonNumber={!!editingId}
            avgUnitPriceInfo={avgUnitPriceInfo}
            suppliers={suppliers}
            onSupplierAdded={(supplier) =>
              setSuppliers((prev) => (prev.some((s) => s.id === supplier.id) ? prev : [...prev, supplier]))
            }
            onGasoilContactAdded={(contact) =>
              setGasoilContacts((prev) =>
                prev.some((c) => c.id === contact.id) ? prev : [...prev, contact],
              )
            }
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                resetForm();
                returnToList();
              }}
            >
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitBon()}>
              {saving
                ? "Enregistrement…"
                : editingId
                  ? isCommande
                    ? "Enregistrer les modifications"
                    : "Enregistrer le bon"
                  : saveLabel}
            </button>
          </div>
        </div>
      ) : null}

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
