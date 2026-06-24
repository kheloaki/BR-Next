"use client";

import { useMemo } from "react";
import { GasoilContactSelectWithAdd } from "@/components/admin/GasoilContactSelectWithAdd";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { FrenchDateInput } from "@/components/admin/FrenchDateTimeInput";
import { MatriculeInput } from "@/components/admin/MatriculeInput";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import type {
  AdminProject,
  GasoilContact,
  MaterialCategory,
  RentalBonLine,
  RentalEquipmentStatus,
  RentalMaterial,
} from "@/components/admin/operations-types";
import { MATERIAL_CATEGORY_LABELS, RENTAL_HOURS_PER_DAY } from "@/components/admin/operations-types";
import {
  btnDanger,
  btnSecondary,
  inputClass,
  inputClassDense,
} from "@/components/admin/admin-form-styles";
import { DEFAULT_VAT_RATE, formatMoney, htToTtc } from "@/lib/admin/price-ht-ttc";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";
import {
  RENTAL_LOCATAIRE_DEFAULT,
  computeBonLineRental,
  computeBonLinesTotal,
  emptyBonLine,
} from "@/lib/admin/map-rental-material";
import { formatBonLocationNo } from "@/lib/admin/rental-bon-number-format";

export type RentalBonFormState = {
  bonLocationNo: string;
  projectId: string;
  locataire: string;
  ownerName: string;
  driverName: string;
  driverContactId: string;
  lines: RentalBonLine[];
  status: RentalEquipmentStatus;
};

export const EMPTY_BON_FORM: RentalBonFormState = {
  bonLocationNo: "",
  projectId: "",
  locataire: RENTAL_LOCATAIRE_DEFAULT,
  ownerName: "",
  driverName: "",
  driverContactId: "",
  lines: [emptyBonLine()],
  status: "active",
};

function driverFromMaterial(m: RentalMaterial) {
  return {
    driverContactId: m.driverContactId ?? "",
    driverName: m.driverName ?? "",
  };
}

type Props = {
  form: RentalBonFormState;
  onChange: (patch: Partial<RentalBonFormState>) => void;
  materials: RentalMaterial[];
  projects: AdminProject[];
  gasoilContacts: GasoilContact[];
  onGasoilContactAdded?: (contact: GasoilContact) => void;
};

export function RentalBonContractForm({
  form,
  onChange,
  materials,
  projects,
  gasoilContacts,
  onGasoilContactAdded,
}: Props) {
  const materialsForProject = useMemo(() => {
    if (!form.projectId) return [];
    const matched = materials.filter((m) => m.active && m.projectId === form.projectId);
    if (form.lines.some((l) => l.materialId && !matched.some((m) => m.id === l.materialId))) {
      for (const line of form.lines) {
        if (line.materialId && !matched.some((m) => m.id === line.materialId)) {
          const extra = materials.find((m) => m.id === line.materialId);
          if (extra) matched.push(extra);
        }
      }
    }
    return matched;
  }, [materials, form.projectId, form.lines]);
  const totalMad = computeBonLinesTotal(form.lines);
  const totalTtc = htToTtc(totalMad, DEFAULT_VAT_RATE);
  const projectLabel = projects.find((p) => p.id === form.projectId);

  function patchLine(index: number, patch: Partial<RentalBonLine>) {
    const lines = form.lines.map((l, i) => (i === index ? { ...l, ...patch } : l));
    onChange({ lines });
  }

  function onLineMaterialChange(index: number, materialId: string) {
    const m = materials.find((x) => x.id === materialId);
    if (!m) {
      patchLine(index, { materialId: "", matricule: "", designation: "" });
      return;
    }
    const lines = form.lines.map((l, i) =>
      i === index
        ? {
            ...l,
            materialId,
            matricule: m.matricule || m.reference,
            designation: [m.designation, m.subCategory].filter(Boolean).join(" — "),
            dailyRate: m.dailyRate || l.dailyRate,
          }
        : l,
    );
    onChange({
      lines,
      ownerName: form.ownerName || m.ownerName,
      ...driverFromMaterial(m),
    });
  }

  function addLine() {
    onChange({ lines: [...form.lines, emptyBonLine()] });
  }

  function removeLine(index: number) {
    if (form.lines.length <= 1) return;
    onChange({ lines: form.lines.filter((_, i) => i !== index) });
  }

  return (
    <div className="mx-auto max-w-4xl border-2 border-[var(--navy)] bg-white shadow-sm">
      <div className="border-b-2 border-[var(--navy)] px-4 py-3 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Bon de location</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs font-semibold uppercase text-[var(--graphite)]/70">N°</span>
          <input
            className="w-36 border-b border-[var(--navy)] bg-transparent px-1 py-0.5 text-center text-sm font-mono outline-none focus:border-[var(--gold)]"
            placeholder="000001 (auto si vide)"
            inputMode="numeric"
            value={form.bonLocationNo}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              onChange({ bonLocationNo: raw ? formatBonLocationNo(raw) : "" });
            }}
          />
        </div>
      </div>

      <div className="grid gap-0 border-b-2 border-[var(--navy)] sm:grid-cols-3">
        <div className="border-b border-[var(--navy)] p-3 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--graphite)]/70">Locataire</p>
          <input
            className="mt-1 w-full border-0 bg-transparent p-0 text-sm font-medium text-[var(--navy)] outline-none"
            value={form.locataire}
            onChange={(e) => onChange({ locataire: e.target.value })}
          />
        </div>
        <div className="border-b border-[var(--navy)] p-3 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--graphite)]/70">Loueur</p>
          <input
            className="mt-1 w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-[var(--graphite)]/40"
            placeholder="Fournisseur du matériel"
            value={form.ownerName}
            onChange={(e) => onChange({ ownerName: e.target.value })}
          />
        </div>
        <div className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--graphite)]/70">
            Lieu de travaux *
          </p>
          <div className="mt-1">
            <ProjectSelect
              projects={projects}
              value={form.projectId}
              onChange={(id) => onChange({ projectId: id })}
              allowEmpty
              placeholder="— Chantier —"
            />
          </div>
        </div>
      </div>

      <div className="border-b-2 border-[var(--navy)] p-3">
        <GasoilContactSelectWithAdd
          role="conducteur"
          contacts={gasoilContacts}
          projects={projects}
          defaultProjectIds={form.projectId ? [form.projectId] : []}
          projectFilterId={form.projectId || undefined}
          value={form.driverContactId}
          onChange={(id, name) => onChange({ driverContactId: id, driverName: name })}
          onContactAdded={onGasoilContactAdded}
          placeholder="— Conducteur —"
          standardInput
          label="Conducteur *"
        />
        {!form.driverContactId ? (
          <input
            className={`${inputClass} mt-2`}
            placeholder="Ou saisir le nom du conducteur"
            value={form.driverName}
            onChange={(e) => onChange({ driverName: e.target.value })}
          />
        ) : null}
      </div>

      {!form.projectId ? (
        <p className="border-b border-[#f0d4b8] bg-[#fff8f0] px-4 py-2 text-sm text-[#7a3d12]">
          Sélectionnez le lieu de travaux (chantier) pour saisir les lignes journalières.
        </p>
      ) : null}

      <div className="overflow-x-auto touch-pan-x overscroll-x-contain">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--navy)] bg-[#fafafa]">
              <th className="border-r border-[var(--navy)] px-2 py-2 text-[10px] font-bold uppercase">Date</th>
              <th className="border-r border-[var(--navy)] px-2 py-2 text-[10px] font-bold uppercase">Matricule</th>
              <th className="border-r border-[var(--navy)] px-2 py-2 text-[10px] font-bold uppercase">
                Camion / Engin
              </th>
              <th className="border-r border-[var(--navy)] px-2 py-2 text-[10px] font-bold uppercase">
                Pv / jr HT / TTC
                <span className="block font-normal normal-case text-[var(--graphite)]/60">1 jr = {RENTAL_HOURS_PER_DAY} h</span>
              </th>
              <th className="min-w-[7.5rem] border-r border-[var(--navy)] px-2 py-2 text-[10px] font-bold uppercase">
                N° usage
                <span className="block font-normal normal-case text-[var(--graphite)]/60">quantité · jour ou heure</span>
              </th>
              <th className="w-10 px-1 py-2" />
            </tr>
          </thead>
          <tbody>
            {form.lines.map((line, index) => (
              <tr key={index} className="border-b border-[var(--navy)]/30">
                <td className="border-r border-[var(--navy)]/30 p-1 align-top">
                  <FrenchDateInput
                    className={inputClassDense}
                    disabled={!form.projectId}
                    value={line.lineDate}
                    onChange={(lineDate) => patchLine(index, { lineDate })}
                  />
                </td>
                <td className="border-r border-[var(--navy)]/30 p-1 align-top">
                  <MatriculeInput
                    compact
                    disabled={!form.projectId}
                    value={line.matricule}
                    onChange={(matricule) => patchLine(index, { matricule })}
                  />
                </td>
                <td className="border-r border-[var(--navy)]/30 p-1 align-top">
                  <SearchableSelect
                    compact
                    disabled={!form.projectId}
                    value={line.materialId}
                    onChange={(materialId) => onLineMaterialChange(index, materialId)}
                    placeholder="— Matériel catalogue —"
                    inputClassName={`${inputClassDense} mb-1`}
                    options={materialsForProject.map((m) => ({
                      value: m.id,
                      label: `[${MATERIAL_CATEGORY_LABELS[m.materialCategory as MaterialCategory]}] ${materialLabel(m)}${m.driverName ? ` · ${m.driverName}` : ""}`,
                      keywords: `${m.reference} ${m.matricule} ${m.designation}`,
                    }))}
                  />
                  <input
                    className={inputClassDense}
                    disabled={!form.projectId}
                    placeholder="Désignation"
                    value={line.designation}
                    onChange={(e) => patchLine(index, { designation: e.target.value })}
                  />
                </td>
                <td className="border-r border-[var(--navy)]/30 p-1 align-top">
                  <HtTtcPriceFields
                    vatRate={DEFAULT_VAT_RATE}
                    valueHt={line.dailyRate}
                    onChangeHt={(ht) => patchLine(index, { dailyRate: ht })}
                    compact
                    showLabels={false}
                    disabled={!form.projectId}
                  />
                  <p className="mt-1 text-[9px] tabular-nums text-[var(--graphite)]/60">
                    Ligne : {formatMoney(computeBonLineRental(line))} HT
                  </p>
                </td>
                <td className="min-w-[7.5rem] border-r border-[var(--navy)]/30 p-1 align-top">
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      className={`${inputClassDense} w-full tabular-nums`}
                      disabled={!form.projectId}
                      value={line.usageQty || ""}
                      onChange={(e) =>
                        patchLine(index, { usageQty: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                    <div className="grid grid-cols-2 gap-1">
                      {(
                        [
                          { unit: "jour" as const, label: "Jour" },
                          { unit: "heure" as const, label: "Heure" },
                        ] as const
                      ).map(({ unit, label }) => {
                        const active = (line.usageUnit || "jour") === unit;
                        return (
                          <button
                            key={unit}
                            type="button"
                            disabled={!form.projectId}
                            className={
                              active
                                ? "min-h-[32px] rounded-md bg-[var(--navy)] px-1 text-[10px] font-semibold text-white disabled:opacity-50"
                                : "min-h-[32px] rounded-md border border-border bg-white px-1 text-[10px] font-medium text-[var(--graphite)] disabled:opacity-50"
                            }
                            onClick={() => patchLine(index, { usageUnit: unit })}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </td>
                <td className="p-1 align-top">
                  <button
                    type="button"
                    className={btnDanger}
                    disabled={form.lines.length <= 1}
                    onClick={() => removeLine(index)}
                    aria-label="Supprimer la ligne"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--navy)] px-4 py-3">
        <button type="button" className={btnSecondary} disabled={!form.projectId} onClick={addLine}>
          + Ligne
        </button>
        <p className="text-sm text-[var(--navy)]">
          Total estimé : <strong>{formatMoney(totalMad)} HT</strong>
          {" · "}
          <strong>{formatMoney(totalTtc)} TTC</strong>
          <span className="text-[var(--graphite)]/70"> (TVA {DEFAULT_VAT_RATE}%)</span>
          {projectLabel ? (
            <span className="text-[var(--graphite)]/70"> · {projectLabel.name}</span>
          ) : null}
        </p>
      </div>

      <div className="border-t border-[var(--navy)]/20 bg-[#fafafa] px-4 py-2 text-center text-[10px] text-[var(--graphite)]/70">
        +212 661 65 60 42 · www.baraneinvest.com · baraneinvest@gmail.com · N130 Bloc 25, Avenue Mimosa, Hay El Farah,
        Agadir
      </div>
    </div>
  );
}

export function validateRentalBonForm(form: RentalBonFormState) {
  if (!form.projectId) return "Sélectionnez le lieu de travaux (chantier).";
  if (!form.driverName.trim() && !form.driverContactId) return "Indiquez le conducteur.";
  const validLines = form.lines.filter(
    (l) =>
      l.lineDate &&
      (l.designation.trim() || l.matricule.trim()) &&
      l.dailyRate > 0 &&
      (l.usageQty ?? 1) > 0,
  );
  if (validLines.length === 0) {
    return "Ajoutez au moins une ligne avec date, matériel, tarif et n° usage.";
  }
  return null;
}
