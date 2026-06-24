import {
  SUPPLIER_SUPPLY_TYPE_LABELS,
  SUPPLIER_SUPPLY_TYPES,
  type BuiltinSupplierSupplyType,
} from "@/lib/admin/supplier-types";

export type SupplierSupplyTypeOption = {
  slug: string;
  label: string;
  isSystem: boolean;
};

export const BUILTIN_SUPPLY_TYPE_OPTIONS: SupplierSupplyTypeOption[] = SUPPLIER_SUPPLY_TYPES.map(
  (slug) => ({
    slug,
    label: SUPPLIER_SUPPLY_TYPE_LABELS[slug],
    isSystem: true,
  }),
);

const BUILTIN_SLUGS = new Set<string>(SUPPLIER_SUPPLY_TYPES);

export function slugifySupplyTypeLabel(label: string): string {
  const base = label
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!base) return "custom";
  if (BUILTIN_SLUGS.has(base as BuiltinSupplierSupplyType)) return `custom_${base}`;
  return base;
}

export function mergeSupplyTypeOptions(
  custom: SupplierSupplyTypeOption[],
): SupplierSupplyTypeOption[] {
  const bySlug = new Map<string, SupplierSupplyTypeOption>();
  for (const opt of BUILTIN_SUPPLY_TYPE_OPTIONS) bySlug.set(opt.slug, opt);
  for (const opt of custom) {
    if (!bySlug.has(opt.slug)) bySlug.set(opt.slug, opt);
  }
  return [...bySlug.values()].sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function supplyTypeLabelsMap(options: SupplierSupplyTypeOption[]) {
  return new Map(options.map((o) => [o.slug, o.label]));
}

export function formatSupplyTypesLabelsFromCatalog(
  types: string[],
  options: SupplierSupplyTypeOption[],
) {
  if (types.length === 0) return "—";
  const labels = supplyTypeLabelsMap(options);
  return types
    .map((t) => labels.get(t) ?? SUPPLIER_SUPPLY_TYPE_LABELS[t as BuiltinSupplierSupplyType] ?? t)
    .join(", ");
}

export function isKnownSupplyTypeSlug(slug: string, options: SupplierSupplyTypeOption[]) {
  return options.some((o) => o.slug === slug);
}
