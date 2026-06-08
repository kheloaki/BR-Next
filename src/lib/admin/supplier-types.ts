/** Ce que le fournisseur nous approvisionne — un fournisseur peut avoir plusieurs types. */
export const SUPPLIER_SUPPLY_TYPES = [
  "gasoil",
  "pieces",
  "lubrifiant",
  "materiel",
  "services",
  "divers",
] as const;

export type SupplierSupplyType = (typeof SUPPLIER_SUPPLY_TYPES)[number];

export const SUPPLIER_SUPPLY_TYPE_LABELS: Record<SupplierSupplyType, string> = {
  gasoil: "Carburant / gasoil",
  pieces: "Pièces & usure",
  lubrifiant: "Lubrifiants",
  materiel: "Matériel & équipement",
  services: "Services",
  divers: "Divers",
};

export function normalizeSupplyTypes(raw: unknown): SupplierSupplyType[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is SupplierSupplyType =>
    SUPPLIER_SUPPLY_TYPES.includes(t as SupplierSupplyType),
  );
}

export function supplierMatchesSupplyType(
  supplyTypes: SupplierSupplyType[],
  type: SupplierSupplyType,
) {
  return supplyTypes.length === 0 || supplyTypes.includes(type);
}

export function formatSupplyTypesLabels(types: SupplierSupplyType[]) {
  if (types.length === 0) return "—";
  return types.map((t) => SUPPLIER_SUPPLY_TYPE_LABELS[t]).join(", ");
}
