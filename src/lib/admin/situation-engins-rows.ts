export type SituationEnginsActivityKind = "location" | "transport" | "gasoil" | "piece" | "lubrifiant";

/** Ligne unifiée — location, gasoil, pièces (tri chronologique). */
export type SituationEnginsActivityRow = {
  date: string;
  kind: SituationEnginsActivityKind;
  kindLabel: string;
  documentNo: string;
  matricule: string;
  designation: string;
  qtyLabel: string;
  unitPrice: number;
  total: number;
  info: string;
};

const KIND_ORDER: Record<SituationEnginsActivityKind, number> = {
  location: 0,
  transport: 1,
  gasoil: 2,
  piece: 3,
  lubrifiant: 4,
};

export function sortSituationActivityRows(rows: SituationEnginsActivityRow[]) {
  return [...rows].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    const byMat = a.matricule.localeCompare(b.matricule, "fr");
    if (byMat !== 0) return byMat;
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  });
}

export function formatActivityQty(days: number) {
  const rounded = Math.round(days * 10) / 10;
  const label = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
  return `${label} j`;
}
