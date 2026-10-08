"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { GasoilContactSelectWithAdd } from "@/components/admin/GasoilContactSelectWithAdd";
import { FrenchDateInput, FrenchTimeInput } from "@/components/admin/FrenchDateTimeInput";
import { MatriculeInput } from "@/components/admin/MatriculeInput";
import { MaterialSelect } from "@/components/admin/MaterialSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import type {
  AdminProject,
  GasoilContact,
  RentalMaterial,
} from "@/components/admin/operations-types";
import {
  GASOIL_VEHICLE_CATEGORIES,
  GASOIL_VEHICLE_CATEGORY_LABELS,
  materialCategoryToGasoilCategory,
} from "@/lib/admin/gasoil-bon";
import { emptyGasoilBonLine, sumGasoilBonLineLitres } from "@/lib/admin/gasoil-bon-lines";
import { formatBonLocationNo } from "@/lib/admin/rental-bon-number-format";
import type { GasoilBonFormState, GasoilBonLineForm } from "@/components/admin/FuelGasoilBonForm";
import type { GasoilUnitPriceInfo } from "@/lib/admin/gasoil-unit-price";
import { formatMoney } from "@/lib/admin/price-ht-ttc";

const thCell =
  "border border-[var(--navy)] px-2 py-1.5 text-[10px] font-bold uppercase leading-tight text-[var(--navy)]";
const tdCell = "border border-[var(--navy)] p-1 align-top";
const cellInput =
  "w-full min-w-0 border-0 bg-transparent px-1 py-1 text-xs outline-none placeholder:text-[var(--graphite)]/40";

type Props = {
  form: GasoilBonFormState;
  onChange: (patch: Partial<GasoilBonFormState>) => void;
  projects: AdminProject[];
  materials: RentalMaterial[];
  gasoilContacts: GasoilContact[];
  onGasoilContactAdded: (contact: GasoilContact) => void;
  lockBonNumber?: boolean;
  avgUnitPriceInfo?: GasoilUnitPriceInfo | null;
};

export function FuelGasoilBonSortieForm({
  form,
  onChange,
  projects,
  materials,
  gasoilContacts,
  onGasoilContactAdded,
  lockBonNumber,
  avgUnitPriceInfo,
}: Props) {
  const lines = form.lines.length > 0 ? form.lines : [emptyGasoilBonLine()];

  const materialsForBon = useMemo(() => {
    const list = materials.filter((m) => {
      if (!m.active) return false;
      if (form.projectId && m.projectId !== form.projectId) return false;
      return true;
    });
    const tab = form.vehicleCategory;
    return [...list].sort((a, b) => {
      const score = (m: RentalMaterial) =>
        materialCategoryToGasoilCategory(m.materialCategory) === tab ? 0 : 1;
      return score(a) - score(b);
    });
  }, [materials, form.projectId, form.vehicleCategory]);

  const projectLabel = projects.find((p) => p.id === form.projectId);
  const litres = sumGasoilBonLineLitres(lines);
  const unitPrice =
    typeof form.unitPricePerLitre === "number" ? form.unitPricePerLitre : Number(form.unitPricePerLitre) || 0;
  const totalAmount = litres > 0 && unitPrice > 0 ? litres * unitPrice : 0;
  const avgPrice = avgUnitPriceInfo?.unitPricePerLitre ?? 0;

  function setLines(next: GasoilBonLineForm[]) {
    const primary = next[0];
    onChange({
      lines: next,
      bonDate: primary?.bonDate ?? form.bonDate,
      materialId: primary?.materialId ?? form.materialId,
      vehicleLabel: primary?.vehicleLabel ?? form.vehicleLabel,
      pumpMeter: primary?.pumpMeter ?? form.pumpMeter,
      fuelTime: primary?.fuelTime ?? form.fuelTime,
      litres: sumGasoilBonLineLitres(next) || "",
    });
  }

  function patchLine(id: string, patch: Partial<GasoilBonLineForm>) {
    setLines(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addLine() {
    const last = lines[lines.length - 1];
    setLines([
      ...lines,
      emptyGasoilBonLine({
        bonDate: last?.bonDate || form.bonDate,
        materialId: last?.materialId || "",
        vehicleLabel: last?.vehicleLabel || "",
        fuelTime: "",
        pumpMeter: "",
        litres: "",
      }),
    ]);
  }

  function removeLine(id: string) {
    if (lines.length <= 1) return;
    setLines(lines.filter((line) => line.id !== id));
  }

  return (
    <div className="mx-auto max-w-4xl border-2 border-[var(--navy)] bg-white shadow-sm">
      <div className="border-b-2 border-[var(--navy)] px-4 py-3 text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Bon de sortie gasoil</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs font-semibold uppercase text-[var(--graphite)]/70">N°</span>
          <input
            className="w-36 border-b border-[var(--navy)] bg-transparent px-1 py-0.5 text-center text-sm font-mono outline-none focus:border-[var(--gold)] disabled:opacity-70"
            placeholder="079621 (auto si vide)"
            inputMode="numeric"
            value={form.bonNumber}
            readOnly={lockBonNumber}
            disabled={lockBonNumber}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              onChange({ bonNumber: raw ? formatBonLocationNo(raw) : "" });
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 border-b border-[var(--navy)] px-3 py-2">
        {GASOIL_VEHICLE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className={
              form.vehicleCategory === c
                ? "min-h-[36px] rounded-md bg-[var(--navy)] px-3 text-[10px] font-medium text-white"
                : "min-h-[36px] rounded-md border border-border bg-white px-3 text-[10px] text-[var(--graphite)]"
            }
            onClick={() => onChange({ vehicleCategory: c })}
          >
            {GASOIL_VEHICLE_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="border-b-2 border-[var(--navy)] px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-xs font-bold uppercase text-[var(--graphite)]/70">Chantier :</span>
          <div className="min-w-[200px] flex-1">
            <ProjectSelect
              projects={projects}
              value={form.projectId}
              onChange={(id) => {
                const patch: Partial<GasoilBonFormState> = { projectId: id };
                const nextLines = lines.map((line) => {
                  if (!line.materialId) return line;
                  const stillValid = materials.some(
                    (m) => m.id === line.materialId && m.active && (!id || m.projectId === id),
                  );
                  if (stillValid) return line;
                  return { ...line, materialId: "", vehicleLabel: "" };
                });
                patch.lines = nextLines;
                patch.materialId = nextLines[0]?.materialId ?? "";
                patch.vehicleLabel = nextLines[0]?.vehicleLabel ?? "";
                onChange(patch);
              }}
              allowEmpty
              placeholder="— Chantier —"
            />
          </div>
          {projectLabel ? (
            <span className="text-xs text-[var(--graphite)]/60">{projectLabel.name}</span>
          ) : null}
        </div>
        <p className="mt-1 text-[10px] text-[var(--graphite)]/50">
          Lieu d&apos;alimentation / مكان التزويد — identique au chantier
        </p>
      </div>

      <div className="overflow-x-auto touch-pan-x overscroll-x-contain">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr>
              <th className={thCell}>
                Date
                <br />
                <span className="font-normal normal-case text-[var(--graphite)]/60">التاريخ</span>
              </th>
              <th className={thCell}>
                Équipement / Matricule
                <br />
                <span className="font-normal normal-case text-[var(--graphite)]/60">المركبة / الترقيم</span>
              </th>
              <th className={thCell}>
                Compteur (H/km)
                <br />
                <span className="font-normal normal-case text-[var(--graphite)]/60">العداد</span>
              </th>
              <th className={thCell}>
                Heure d&apos;alimentation
                <br />
                <span className="font-normal normal-case text-[var(--graphite)]/60">ساعة التزويد</span>
              </th>
              <th className={thCell}>
                Nombre de litres
                <br />
                <span className="font-normal normal-case text-[var(--graphite)]/60">عدد اللترات</span>
              </th>
              <th className={`${thCell} w-10`} aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <td className={tdCell}>
                  <FrenchDateInput
                    variant="inline"
                    className={cellInput}
                    value={line.bonDate}
                    onChange={(bonDate) => patchLine(line.id, { bonDate })}
                  />
                </td>
                <td className={tdCell}>
                  <div className="space-y-1">
                    <MaterialSelect
                      materials={materialsForBon}
                      value={line.materialId}
                      onChange={(id) => {
                        const m = materialsForBon.find((x) => x.id === id);
                        const next = lines.map((row) =>
                          row.id === line.id
                            ? {
                                ...row,
                                materialId: id,
                                vehicleLabel:
                                  m?.matricule?.trim() || m?.reference?.trim() || row.vehicleLabel,
                              }
                            : row,
                        );
                        const primary = next[0];
                        onChange({
                          lines: next,
                          bonDate: primary?.bonDate ?? form.bonDate,
                          materialId: primary?.materialId ?? "",
                          vehicleLabel: primary?.vehicleLabel ?? "",
                          pumpMeter: primary?.pumpMeter ?? "",
                          fuelTime: primary?.fuelTime ?? "",
                          litres: sumGasoilBonLineLitres(next) || "",
                          vehicleCategory: m
                            ? materialCategoryToGasoilCategory(m.materialCategory)
                            : form.vehicleCategory,
                        });
                      }}
                      label=""
                      placeholder={form.projectId ? "— Matériel —" : "— Chantier d'abord —"}
                      requireProjectFirst={!form.projectId}
                      disabled={!form.projectId}
                    />
                    <MatriculeInput
                      compact
                      value={line.vehicleLabel}
                      onChange={(vehicleLabel) => patchLine(line.id, { vehicleLabel })}
                    />
                  </div>
                </td>
                <td className={tdCell}>
                  <input
                    type="number"
                    className={cellInput}
                    placeholder="H ou km"
                    value={line.pumpMeter}
                    onChange={(e) => patchLine(line.id, { pumpMeter: e.target.value })}
                  />
                </td>
                <td className={tdCell}>
                  <FrenchTimeInput
                    className={cellInput}
                    value={line.fuelTime}
                    onChange={(fuelTime) => patchLine(line.id, { fuelTime })}
                  />
                </td>
                <td className={tdCell}>
                  <input
                    type="number"
                    className={`${cellInput} font-medium`}
                    placeholder="L"
                    value={line.litres}
                    onChange={(e) =>
                      patchLine(line.id, {
                        litres: e.target.value === "" ? "" : Number(e.target.value) || 0,
                      })
                    }
                  />
                </td>
                <td className={`${tdCell} text-center`}>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-[var(--graphite)]/55 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-30"
                    disabled={lines.length <= 1}
                    aria-label="Supprimer la ligne"
                    onClick={() => removeLine(line.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--navy)] px-4 py-2">
        <button
          type="button"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-[var(--navy)]/25 bg-white px-3 text-xs font-medium text-[var(--navy)] transition hover:bg-[var(--background)]"
          onClick={addLine}
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter une ligne
        </button>
        <p className="text-[10px] text-[var(--graphite)]/55">
          Comme sur le bon papier — plusieurs dates / litres sur le même N°
        </p>
      </div>

      <div className="border-b-2 border-[var(--navy)] bg-[var(--background)]/40 px-4 py-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <p className="text-[10px] font-bold uppercase text-[var(--graphite)]/70">Prix appliqué (MAD/L)</p>
            <p className="text-[9px] text-[var(--graphite)]/50">Coût gasoil pour ce bon — modifiable</p>
            <input
              type="number"
              min={0}
              step={0.01}
              className={`${cellInput} mt-1 w-full max-w-[140px] border-b border-[var(--navy)]/30 font-medium`}
              placeholder="0,00"
              value={form.unitPricePerLitre}
              onChange={(e) =>
                onChange({
                  unitPricePerLitre: e.target.value === "" ? "" : Number(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="min-w-[160px] text-xs text-[var(--graphite)]/75">
            {avgPrice > 0 ? (
              <>
                <p>
                  Moyenne achats stock :{" "}
                  <span className="font-medium text-[var(--navy)]">
                    {avgPrice.toLocaleString("fr-MA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MAD/L
                  </span>
                </p>
                {avgUnitPriceInfo?.label ? (
                  <p className="mt-0.5 text-[10px] text-[var(--graphite)]/55">{avgUnitPriceInfo.label}</p>
                ) : null}
                {unitPrice !== avgPrice ? (
                  <button
                    type="button"
                    className="mt-1 text-[10px] font-medium text-[var(--navy)] underline underline-offset-2"
                    onClick={() => onChange({ unitPricePerLitre: avgPrice })}
                  >
                    Reprendre la moyenne
                  </button>
                ) : null}
              </>
            ) : (
              <p className="text-[10px] text-amber-800">
                Aucune moyenne disponible — saisissez un BC gasoil avec prix ou le prix manuellement.
              </p>
            )}
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] font-bold uppercase text-[var(--graphite)]/70">Total litres</p>
            <p className="mt-0.5 text-xs tabular-nums text-[var(--graphite)]/70">
              {litres > 0 ? `${litres.toLocaleString("fr-MA")} L` : "—"}
              {lines.length > 1 ? ` · ${lines.length} lignes` : ""}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase text-[var(--graphite)]/70">Montant gasoil</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--navy)]">
              {totalAmount > 0 ? formatMoney(totalAmount) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid border-t-2 border-[var(--navy)] sm:grid-cols-3">
        <div className="border-b border-[var(--navy)] p-3 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-bold uppercase text-[var(--graphite)]/70">Conducteur</p>
          <p className="text-[9px] text-[var(--graphite)]/50">الاسم العائلي و الشخصي للسائق</p>
          <div className="mt-2">
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
              compact
            />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase text-[var(--graphite)]/70">Signature</p>
          <div className="mt-2 h-10 border-b border-dotted border-[var(--navy)]/40" />
        </div>
        <div className="border-b border-[var(--navy)] p-3 sm:border-b-0 sm:border-r">
          <p className="text-[10px] font-bold uppercase text-[var(--graphite)]/70">Pompiste</p>
          <p className="text-[9px] text-[var(--graphite)]/50">الاسم العائلي و الشخصي للمزود</p>
          <div className="mt-2">
            <GasoilContactSelectWithAdd
              role="pompiste"
              contacts={gasoilContacts}
              value={form.pompisteContactId}
              onChange={(id, name) => onChange({ pompisteContactId: id, pumpAttendant: name })}
              onContactAdded={onGasoilContactAdded}
              placeholder="— Pompiste —"
              compact
            />
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase text-[var(--graphite)]/70">Signature</p>
          <div className="mt-2 h-10 border-b border-dotted border-[var(--navy)]/40" />
        </div>
        <div className="p-3">
          <p className="text-[10px] font-bold uppercase text-[var(--graphite)]/70">Responsable</p>
          <p className="text-[9px] text-[var(--graphite)]/50">الاسم العائلي و الشخصي للمسؤول</p>
          <input
            className={`${cellInput} mt-2 border-b border-dotted border-[var(--navy)]/40`}
            placeholder="Nom, prénom"
            value={form.supervisor}
            onChange={(e) => onChange({ supervisor: e.target.value })}
          />
          <p className="mt-4 text-[10px] font-bold uppercase text-[var(--graphite)]/70">Signature</p>
          <div className="mt-2 h-10 border-b border-dotted border-[var(--navy)]/40" />
        </div>
      </div>

      <div className="border-t border-[var(--navy)] px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-[var(--graphite)]/85">
          <input
            type="checkbox"
            checked={form.syncStock}
            onChange={(e) => onChange({ syncStock: e.target.checked })}
          />
          Mettre à jour le stock gasoil (sortie)
        </label>
      </div>
    </div>
  );
}
