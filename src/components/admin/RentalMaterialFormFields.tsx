"use client";

import { GasoilContactSelectWithAdd } from "@/components/admin/GasoilContactSelectWithAdd";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { MaterialDetailCategorySelectWithAdd } from "@/components/admin/MaterialDetailCategorySelectWithAdd";
import { ProjectSelect } from "@/components/admin/ProjectSelect";
import { SupplierSelectWithAdd } from "@/components/admin/SupplierSelectWithAdd";
import type { Supplier } from "@/components/admin/devis-types";
import type {
  AdminProject,
  GasoilContact,
  MaterialCategory,
  MaterialDetailCategory,
  MaterialTransportMode,
  RentalLocationMode,
} from "@/components/admin/operations-types";
import {
  MATERIAL_CATEGORY_LABELS,
  RENTAL_HOURS_PER_DAY,
  RENTAL_LOCATION_MODE_LABELS,
} from "@/components/admin/operations-types";
import {
  categorySegmentBtnSelected,
  categorySegmentBtnUnselected,
  inputClass,
  labelClass,
} from "@/components/admin/admin-form-styles";
import { DEFAULT_VAT_RATE, formatMoney, htToTtc } from "@/lib/admin/price-ht-ttc";

const CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[];
const LOCATION_MODES = Object.keys(RENTAL_LOCATION_MODE_LABELS) as RentalLocationMode[];

export type RentalMaterialFormValues = {
  materialCategory: MaterialCategory;
  projectId: string;
  reference: string;
  matricule: string;
  designation: string;
  subCategory: string;
  ownerName: string;
  supplierId: string;
  employeeId: string;
  driverName: string;
  driverContactId: string;
  rentalMode: RentalLocationMode;
  contractStartDate: string;
  contractEndDate: string;
  contractOpenEnded: boolean;
  dailyRate: number;
  daysCount: number;
  monthlyPriceHt: number;
  forfaitPriceHt: number;
  transportMode: MaterialTransportMode;
  transportPrice: number;
};

type FormProps = {
  values: RentalMaterialFormValues;
  onChange: (patch: Partial<RentalMaterialFormValues>) => void;
  projects: AdminProject[];
  suppliers: Supplier[];
  gasoilContacts: GasoilContact[];
  materialDetailCategories: MaterialDetailCategory[];
  onSupplierAdded?: (supplier: Supplier) => void;
  onGasoilContactAdded?: (contact: GasoilContact) => void;
  onMaterialDetailCategoriesChange?: (cats: MaterialDetailCategory[]) => void;
};

function RentalContractPeriodFields({
  values,
  onChange,
}: {
  values: RentalMaterialFormValues;
  onChange: (patch: Partial<RentalMaterialFormValues>) => void;
}) {
  return (
    <>
      <div>
        <p className={labelClass}>Date de début du contrat *</p>
        <input
          type="date"
          className={`${inputClass} mt-1`}
          value={values.contractStartDate}
          onChange={(e) => onChange({ contractStartDate: e.target.value })}
        />
      </div>
      <div>
        <p className={labelClass}>Date de fin du contrat</p>
        <input
          type="date"
          className={`${inputClass} mt-1`}
          value={values.contractEndDate}
          disabled={values.contractOpenEnded}
          onChange={(e) => onChange({ contractEndDate: e.target.value })}
        />
        <label className="mt-2 flex items-center gap-2 text-xs text-[var(--graphite)]/80">
          <input
            type="checkbox"
            checked={values.contractOpenEnded}
            onChange={(e) =>
              onChange({
                contractOpenEnded: e.target.checked,
                contractEndDate: e.target.checked ? "" : values.contractEndDate,
              })
            }
          />
          Contrat ouvert (sans date de fin)
        </label>
      </div>
    </>
  );
}

export function RentalMaterialFormFields({
  values,
  onChange,
  projects,
  suppliers,
  gasoilContacts,
  materialDetailCategories,
  onSupplierAdded,
  onGasoilContactAdded,
  onMaterialDetailCategoriesChange,
}: FormProps) {
  const cat = values.materialCategory;
  const mode = values.rentalMode;
  const showRef = cat === "engin" || cat === "groupe_electrogen";
  const showMatricule = cat === "camion" || cat === "voiture";
  const showSubCategory = cat === "engin" || cat === "camion" || cat === "groupe_electrogen";
  const showTransport = cat === "engin" || cat === "groupe_electrogen";
  const showChauffeur = cat === "engin" || cat === "camion" || cat === "voiture";
  const isJour = mode === "jour";
  const isMois = mode === "mois";
  const isForfait = mode === "forfait";

  const transportTotal = values.transportMode === "depart" ? values.transportPrice : 0;
  const dailyTtc = htToTtc(values.dailyRate, DEFAULT_VAT_RATE);

  return (
    <>
      <div className="sm:col-span-2">
        <p className={labelClass}>Catégorie *</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={values.materialCategory === c ? categorySegmentBtnSelected : categorySegmentBtnUnselected}
              onClick={() =>
                onChange({
                  materialCategory: c,
                  subCategory: c === values.materialCategory ? values.subCategory : "",
                  transportMode: c === "engin" || c === "groupe_electrogen" ? values.transportMode : "",
                  transportPrice: c === "engin" || c === "groupe_electrogen" ? values.transportPrice : 0,
                  driverContactId: c === "engin" || c === "camion" || c === "voiture" ? values.driverContactId : "",
                  driverName: c === "engin" || c === "camion" || c === "voiture" ? values.driverName : "",
                  employeeId: "",
                })
              }
            >
              {MATERIAL_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2">
        <p className={labelClass}>Mode de location *</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LOCATION_MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={values.rentalMode === m ? categorySegmentBtnSelected : categorySegmentBtnUnselected}
              onClick={() => onChange({ rentalMode: m })}
            >
              {RENTAL_LOCATION_MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2">
        <p className={labelClass}>Chantier</p>
        <div className="mt-1">
          <ProjectSelect
            projects={projects}
            value={values.projectId}
            onChange={(id) => onChange({ projectId: id })}
            allowEmpty
          />
        </div>
      </div>

      {showRef ? (
        <div>
          <p className={labelClass}>Référence *</p>
          <input
            className={`${inputClass} mt-1`}
            placeholder="Réf. interne"
            value={values.reference}
            onChange={(e) => onChange({ reference: e.target.value })}
          />
        </div>
      ) : null}

      {showMatricule ? (
        <div>
          <p className={labelClass}>Matricule *</p>
          <input
            className={`${inputClass} mt-1`}
            placeholder="Immatriculation"
            value={values.matricule}
            onChange={(e) => onChange({ matricule: e.target.value })}
          />
        </div>
      ) : null}

      <div className={showRef && showMatricule ? "" : "sm:col-span-2"}>
        <p className={labelClass}>Désignation *</p>
        <input
          className={`${inputClass} mt-1`}
          placeholder="Pelle 320, 8x4 benne…"
          value={values.designation}
          onChange={(e) => onChange({ designation: e.target.value })}
        />
      </div>

      {showSubCategory ? (
        <div>
          <MaterialDetailCategorySelectWithAdd
            materialCategory={cat}
            categories={materialDetailCategories}
            value={values.subCategory}
            onChange={(name) => onChange({ subCategory: name })}
            onCategoryAdded={(c) => onMaterialDetailCategoriesChange?.([...materialDetailCategories, c])}
          />
        </div>
      ) : null}

      <div>
        <p className={labelClass}>Fournisseur</p>
        <div className="mt-1">
          <SupplierSelectWithAdd
            suppliers={suppliers}
            supplyType="materiel"
            value={values.supplierId}
            onChange={(id, name) => onChange({ supplierId: id, ownerName: name })}
            onSupplierAdded={onSupplierAdded}
            placeholder="— Fournisseur matériel —"
          />
        </div>
      </div>

      {showChauffeur ? (
        <div>
          <GasoilContactSelectWithAdd
            role="conducteur"
            contacts={gasoilContacts}
            projects={projects}
            defaultProjectIds={values.projectId ? [values.projectId] : []}
            projectFilterId={values.projectId || undefined}
            value={values.driverContactId}
            onChange={(id, name) => onChange({ driverContactId: id, driverName: name })}
            onContactAdded={onGasoilContactAdded}
            placeholder="— Conducteur —"
            standardInput
            label="Chauffeur / conducteur"
          />
        </div>
      ) : null}

      {isJour ? (
        <div className="sm:col-span-2">
          <p className={labelClass}>Prix location / jr HT / TTC *</p>
          <p className="mb-1 text-xs text-[var(--graphite)]/70">
            TVA {DEFAULT_VAT_RATE}% · 1 jr = {RENTAL_HOURS_PER_DAY} h
          </p>
          <HtTtcPriceFields
            vatRate={DEFAULT_VAT_RATE}
            valueHt={values.dailyRate}
            onChangeHt={(ht) => onChange({ dailyRate: ht })}
          />
        </div>
      ) : null}

      {(isMois || isForfait) && (
        <RentalContractPeriodFields values={values} onChange={onChange} />
      )}

      {isMois ? (
        <div className="sm:col-span-2">
          <p className={labelClass}>Prix mensuel HT / TTC *</p>
          <p className="mb-1 text-xs text-[var(--graphite)]/70">TVA {DEFAULT_VAT_RATE}%</p>
          <HtTtcPriceFields
            vatRate={DEFAULT_VAT_RATE}
            valueHt={values.monthlyPriceHt}
            onChangeHt={(ht) => onChange({ monthlyPriceHt: ht })}
          />
        </div>
      ) : null}

      {isForfait ? (
        <div className="sm:col-span-2">
          <p className={labelClass}>Montant forfait HT / TTC *</p>
          <p className="mb-1 text-xs text-[var(--graphite)]/70">TVA {DEFAULT_VAT_RATE}%</p>
          <HtTtcPriceFields
            vatRate={DEFAULT_VAT_RATE}
            valueHt={values.forfaitPriceHt}
            onChangeHt={(ht) => onChange({ forfaitPriceHt: ht })}
          />
        </div>
      ) : null}

      {isJour && showTransport ? (
        <>
          <div>
            <p className={labelClass}>Transport</p>
            <select
              className={`${inputClass} mt-1`}
              value={values.transportMode}
              onChange={(e) =>
                onChange({
                  transportMode: e.target.value as MaterialTransportMode,
                  transportPrice: e.target.value === "depart" ? values.transportPrice : 0,
                })
              }
            >
              <option value="">—</option>
              <option value="rendre">Rendre sur chantier</option>
              <option value="depart">Départ (frais transport)</option>
            </select>
          </div>
          {values.transportMode === "depart" ? (
            <div className="sm:col-span-2">
              <p className={labelClass}>Prix transport HT / TTC</p>
              <p className="mb-1 text-xs text-[var(--graphite)]/70">TVA {DEFAULT_VAT_RATE}%</p>
              <HtTtcPriceFields
                vatRate={DEFAULT_VAT_RATE}
                valueHt={values.transportPrice}
                onChangeHt={(ht) => onChange({ transportPrice: ht })}
              />
            </div>
          ) : null}
        </>
      ) : null}

      {isJour && values.dailyRate > 0 && (
        <p className="sm:col-span-2 text-sm text-[var(--navy)]">
          Tarif journalier : <strong>{formatMoney(values.dailyRate)} HT</strong>
          {" · "}
          <strong>{formatMoney(dailyTtc)} TTC</strong>
          {transportTotal > 0 ? (
            <>
              {" · "}
              Transport : <strong>{formatMoney(transportTotal)} HT</strong>
              {" · "}
              <strong>{formatMoney(htToTtc(transportTotal, DEFAULT_VAT_RATE))} TTC</strong>
            </>
          ) : null}
        </p>
      )}
    </>
  );
}

export function validateRentalMaterialForm(values: RentalMaterialFormValues) {
  const cat = values.materialCategory;
  if (cat === "engin" && !values.reference.trim() && !values.designation.trim()) {
    return "Indiquez la référence ou la désignation.";
  }
  if (cat === "groupe_electrogen" && !values.reference.trim() && !values.designation.trim()) {
    return "Indiquez la référence ou la désignation.";
  }
  if ((cat === "camion" || cat === "voiture") && !values.matricule.trim()) {
    return "Indiquez le matricule.";
  }
  if (!values.designation.trim() && cat !== "engin" && cat !== "groupe_electrogen") {
    return "Indiquez la désignation.";
  }
  if (cat === "voiture" && !values.driverContactId && !values.driverName.trim()) {
    return "Sélectionnez un conducteur.";
  }
  if (cat === "other") return null;

  if (values.rentalMode === "jour") {
    if (values.dailyRate <= 0) return "Indiquez le tarif journalier.";
    return null;
  }

  if (!values.contractStartDate) {
    return "Indiquez la date de début du contrat.";
  }
  if (!values.contractOpenEnded && values.contractEndDate) {
    if (values.contractEndDate < values.contractStartDate) {
      return "La date de fin doit être postérieure à la date de début.";
    }
  }

  if (values.rentalMode === "mois") {
    if (values.monthlyPriceHt <= 0) return "Indiquez le prix mensuel HT ou TTC.";
    return null;
  }

  if (values.rentalMode === "forfait") {
    if (values.forfaitPriceHt <= 0) return "Indiquez le montant forfait HT ou TTC.";
    return null;
  }

  return null;
}

export const EMPTY_RENTAL_MATERIAL_FORM: RentalMaterialFormValues = {
  materialCategory: "engin",
  projectId: "",
  reference: "",
  matricule: "",
  designation: "",
  subCategory: "",
  ownerName: "",
  supplierId: "",
  employeeId: "",
  driverName: "",
  driverContactId: "",
  rentalMode: "jour",
  contractStartDate: "",
  contractEndDate: "",
  contractOpenEnded: false,
  dailyRate: 0,
  daysCount: 0,
  monthlyPriceHt: 0,
  forfaitPriceHt: 0,
  transportMode: "",
  transportPrice: 0,
};

export function rentalMaterialToForm(m: {
  materialCategory: MaterialCategory;
  projectId: string | null;
  reference: string;
  matricule: string;
  designation: string;
  subCategory: string;
  ownerName: string;
  supplierId: string;
  employeeId: string | null;
  driverName: string;
  driverContactId: string | null;
  rentalMode: RentalLocationMode;
  contractStartDate: string | null;
  contractEndDate: string | null;
  contractOpenEnded: boolean;
  dailyRate: number;
  daysCount: number;
  monthlyPriceHt: number;
  forfaitPriceHt: number;
  transportMode: MaterialTransportMode;
  transportPrice: number;
}): RentalMaterialFormValues {
  return {
    materialCategory: m.materialCategory,
    projectId: m.projectId ?? "",
    reference: m.reference,
    matricule: m.matricule,
    designation: m.designation,
    subCategory: m.subCategory,
    ownerName: m.ownerName,
    supplierId: m.supplierId ?? "",
    employeeId: m.employeeId ?? "",
    driverName: m.driverName,
    driverContactId: m.driverContactId ?? "",
    rentalMode: m.rentalMode,
    contractStartDate: m.contractStartDate?.slice(0, 10) ?? "",
    contractEndDate: m.contractEndDate?.slice(0, 10) ?? "",
    contractOpenEnded: m.contractOpenEnded,
    dailyRate: m.dailyRate,
    daysCount: m.daysCount,
    monthlyPriceHt: m.monthlyPriceHt,
    forfaitPriceHt: m.forfaitPriceHt,
    transportMode: m.transportMode,
    transportPrice: m.transportPrice,
  };
}
