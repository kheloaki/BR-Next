import Link from "next/link";
import type { RentalMaterial } from "@/components/admin/operations-types";
import { MATERIAL_CATEGORY_LABELS } from "@/components/admin/operations-types";
import { inputClass, labelClass } from "@/components/admin/admin-form-styles";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";

export function MaterialSelect({
  materials,
  value,
  onChange,
  label = "Matériel *",
  placeholder = "— Sélectionner un matériel —",
  activeOnly = true,
  disabled = false,
  requireProjectFirst = false,
}: {
  materials: RentalMaterial[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  activeOnly?: boolean;
  disabled?: boolean;
  requireProjectFirst?: boolean;
}) {
  const list = activeOnly ? materials.filter((m) => m.active) : materials;

  if (requireProjectFirst && disabled) {
    return (
      <div>
        {label ? <p className={labelClass}>{label}</p> : null}
        <select className={`${inputClass} ${label ? "mt-1" : ""} opacity-60`} disabled value="">
          <option value="">— Sélectionnez d&apos;abord un chantier —</option>
        </select>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div>
        {label ? <p className={labelClass}>{label}</p> : null}
        <p className={`rounded-md border border-[#f0d4b8] bg-[#fff8f0] px-3 py-2 text-sm text-[#7a3d12] ${label ? "mt-1" : ""}`}>
          Aucun matériel pour ce chantier.{" "}
          <Link
            href="/admin/equipment-rental/materials"
            className="font-medium underline underline-offset-2"
          >
            Créer du matériel
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      {label ? <p className={labelClass}>{label}</p> : null}
      <select
        className={`${inputClass} ${label ? "mt-1" : ""}`}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {list.map((m) => (
          <option key={m.id} value={m.id}>
            [{MATERIAL_CATEGORY_LABELS[m.materialCategory]}] {materialLabel(m)}
            {m.ownerName ? ` · ${m.ownerName}` : ""}
          </option>
        ))}
      </select>
    </>
  );
}
