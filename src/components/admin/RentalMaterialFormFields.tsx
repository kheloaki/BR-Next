"use client";

import type { MaterialCategory } from "@/components/admin/operations-types";
import { MATERIAL_CATEGORY_LABELS } from "@/components/admin/operations-types";
import {
  categorySegmentBtnSelected,
  categorySegmentBtnUnselected,
  inputClass,
  labelClass,
} from "@/components/admin/admin-form-styles";

const CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[];

export type RentalMaterialFormValues = {
  materialCategory: MaterialCategory;
  reference: string;
  matricule: string;
  designation: string;
  subCategory: string;
  ownerName: string;
};

export function RentalMaterialFormFields({
  values,
  onChange,
}: {
  values: RentalMaterialFormValues;
  onChange: (patch: Partial<RentalMaterialFormValues>) => void;
}) {
  const showRef = values.materialCategory === "engin" || values.materialCategory === "groupe_electrogen";
  const showMatricule = values.materialCategory === "camion" || values.materialCategory === "voiture";
  const showSubCategory =
    values.materialCategory === "engin" ||
    values.materialCategory === "camion" ||
    values.materialCategory === "groupe_electrogen";

  return (
  <>
      <div className="sm:col-span-2">
        <p className={labelClass}>Catégorie *</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={
                values.materialCategory === c ? categorySegmentBtnSelected : categorySegmentBtnUnselected
              }
              onClick={() => onChange({ materialCategory: c })}
            >
              {MATERIAL_CATEGORY_LABELS[c]}
            </button>
          ))}
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
          <p className={labelClass}>Catégorie détaillée</p>
          <input
            className={`${inputClass} mt-1`}
            placeholder={
              values.materialCategory === "engin"
                ? "Pelle, compacteur…"
                : values.materialCategory === "camion"
                  ? "8x4, 6x4, benne…"
                  : "Puissance kVA…"
            }
            value={values.subCategory}
            onChange={(e) => onChange({ subCategory: e.target.value })}
          />
        </div>
      ) : null}

      <div>
        <p className={labelClass}>Propriétaire</p>
        <input
          className={`${inputClass} mt-1`}
          value={values.ownerName}
          onChange={(e) => onChange({ ownerName: e.target.value })}
        />
      </div>
    </>
  );
}

export function validateRentalMaterialForm(values: RentalMaterialFormValues) {
  const cat = values.materialCategory;
  if (cat === "engin" && !values.reference.trim() && !values.designation.trim()) {
    return "Indiquez la référence ou la désignation.";
  }
  if ((cat === "camion" || cat === "voiture") && !values.matricule.trim()) {
    return "Indiquez le matricule.";
  }
  if (!values.designation.trim() && cat !== "engin") {
    return "Indiquez la désignation.";
  }
  return null;
}

export const EMPTY_RENTAL_MATERIAL_FORM: RentalMaterialFormValues = {
  materialCategory: "engin",
  reference: "",
  matricule: "",
  designation: "",
  subCategory: "",
  ownerName: "",
};
