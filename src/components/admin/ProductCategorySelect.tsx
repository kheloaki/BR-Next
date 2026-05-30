import type { ProductCategory } from "@/components/admin/devis-types";
import { inputClass } from "@/components/admin/admin-form-styles";

export function ProductCategorySelect({
  categories,
  value,
  onChange,
  allowEmpty = true,
  placeholder = "Catégorie…",
}: {
  categories: ProductCategory[];
  value: string;
  onChange: (name: string) => void;
  allowEmpty?: boolean;
  placeholder?: string;
}) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty ? <option value="">{placeholder}</option> : null}
      {categories.map((c) => (
        <option key={c.id} value={c.name}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
