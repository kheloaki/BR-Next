"use client";

import { useMemo } from "react";
import { GasoilContactSelectWithAdd } from "@/components/admin/GasoilContactSelectWithAdd";
import { MaterialSelect } from "@/components/admin/MaterialSelect";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import type { AdminProject, GasoilContact, RentalMaterial } from "@/components/admin/operations-types";
import {
  GASOIL_VEHICLE_CATEGORIES,
  GASOIL_VEHICLE_CATEGORY_LABELS,
} from "@/lib/admin/gasoil-bon";
import { formatBonLocationNo } from "@/lib/admin/rental-bon-number-format";
import type { GasoilBonFormState } from "@/components/admin/FuelGasoilBonForm";
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
  const materialsForBon = useMemo(
    () => materials.filter((m) => m.active),
    [materials],
  );

  const projectLabel = projects.find((p) => p.id === form.projectId);
  const litres = typeof form.litres === "number" ? form.litres : Number(form.litres) || 0;
  const unitPrice =
    typeof form.unitPricePerLitre === "number" ? form.unitPricePerLitre : Number(form.unitPricePerLitre) || 0;
  const totalAmount = litres > 0 && unitPrice > 0 ? litres * unitPrice : 0;
  const avgPrice = avgUnitPriceInfo?.unitPricePerLitre ?? 0;

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
            onClick={() => onChange({ vehicleCategory: c, materialId: "", vehicleLabel: "" })}
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
              onChange={(id) => onChange({ projectId: id })}
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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
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
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={tdCell}>
                <input
                  type="date"
                  className={cellInput}
                  value={form.bonDate}
                  onChange={(e) => onChange({ bonDate: e.target.value })}
                />
              </td>
              <td className={tdCell}>
                <div className="space-y-1">
                  {materialsForBon.length > 0 ? (
                    <MaterialSelect
                      materials={materialsForBon}
                      value={form.materialId}
                      onChange={(id) => {
                        const m = materials.find((x) => x.id === id);
                        onChange({
                          materialId: id,
                          vehicleLabel: m?.matricule?.trim() || m?.reference?.trim() || form.vehicleLabel,
                        });
                      }}
                      label=""
                      placeholder="— Matériel —"
                    />
                  ) : null}
                  <input
                    className={cellInput}
                    placeholder="Matricule / identification"
                    value={form.vehicleLabel}
                    onChange={(e) => onChange({ vehicleLabel: e.target.value })}
                  />
                </div>
              </td>
              <td className={tdCell}>
                <input
                  type="number"
                  className={cellInput}
                  placeholder="H ou km"
                  value={form.pumpMeter}
                  onChange={(e) => onChange({ pumpMeter: e.target.value })}
                />
              </td>
              <td className={tdCell}>
                <input
                  type="time"
                  className={cellInput}
                  value={form.fuelTime}
                  onChange={(e) => onChange({ fuelTime: e.target.value })}
                />
              </td>
              <td className={tdCell}>
                <input
                  type="number"
                  className={`${cellInput} font-medium`}
                  placeholder="L"
                  value={form.litres}
                  onChange={(e) =>
                    onChange({ litres: e.target.value === "" ? "" : Number(e.target.value) || 0 })
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>
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
            <p className="text-[10px] font-bold uppercase text-[var(--graphite)]/70">Montant gasoil</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--navy)]">
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
