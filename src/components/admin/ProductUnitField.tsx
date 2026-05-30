"use client";

import { PRODUCT_UNITS } from "@/components/admin/devis-types";
import { inputClass } from "@/components/admin/admin-form-styles";

type ProductUnitFieldProps = {
  value: string;
  onChange: (unit: string) => void;
  className?: string;
  required?: boolean;
};

export function ProductUnitField({ value, onChange, className, required }: ProductUnitFieldProps) {
  return (
    <div className={className}>
      <input
        list="admin-product-units"
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={required ? "Unité * (u, m², t…)" : "Unité"}
        required={required}
      />
      <datalist id="admin-product-units">
        {PRODUCT_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
    </div>
  );
}
