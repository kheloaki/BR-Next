/** Ce que le fournisseur nous approvisionne — un fournisseur peut avoir plusieurs types. */
export const SUPPLIER_SUPPLY_TYPES = [
  "gasoil",
  "pieces",
  "lubrifiant",
  "materiel",
  "services",
  "divers",
] as const;

export type BuiltinSupplierSupplyType = (typeof SUPPLIER_SUPPLY_TYPES)[number];

/** Slug stocké sur le fournisseur — types système ou personnalisés. */
export type SupplierSupplyType = string;

export const SUPPLIER_SUPPLY_TYPE_LABELS: Record<BuiltinSupplierSupplyType, string> = {
  gasoil: "Carburant / gasoil",
  pieces: "Pièces & usure",
  lubrifiant: "Lubrifiants",
  materiel: "Matériel & équipement",
  services: "Services",
  divers: "Divers",
};

export function normalizeSupplyTypes(raw: unknown): SupplierSupplyType[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((t) => String(t).trim()).filter(Boolean))];
}

export function supplierMatchesSupplyType(
  supplyTypes: SupplierSupplyType[],
  type: SupplierSupplyType,
) {
  return supplyTypes.length === 0 || supplyTypes.includes(type);
}

export function formatSupplyTypesLabels(types: SupplierSupplyType[]) {
  if (types.length === 0) return "—";
  return types
    .map((t) => SUPPLIER_SUPPLY_TYPE_LABELS[t as BuiltinSupplierSupplyType] ?? t)
    .join(", ");
}
