import type { PartsUsage, RentalMaterial } from "@/components/admin/operations-types";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";

export function matchesEnginFilter(
  lineMaterialId: string,
  lineMatricule: string,
  contractMaterialId: string | null,
  contractMatricule: string,
  filterMaterialId: string | undefined,
  materialsById: Map<string, RentalMaterial>,
) {
  if (!filterMaterialId) return true;
  if (lineMaterialId === filterMaterialId || contractMaterialId === filterMaterialId) return true;
  const filterMat = materialsById.get(filterMaterialId);
  const filterMatricule = filterMat?.matricule?.trim().toUpperCase() ?? "";
  const mat = (lineMatricule || contractMatricule).trim().toUpperCase();
  return Boolean(filterMatricule && mat && mat === filterMatricule);
}

function textMatchesMaterial(text: string, mat: RentalMaterial): boolean {
  const hay = text.trim().toUpperCase();
  if (!hay) return false;
  const matricule = mat.matricule?.trim().toUpperCase() ?? "";
  if (matricule && hay.includes(matricule)) return true;
  const ref = mat.reference?.trim().toUpperCase() ?? "";
  if (ref && hay.includes(ref)) return true;
  const des = mat.designation?.trim().toUpperCase() ?? "";
  if (des && hay.includes(des)) return true;
  const label = materialLabel(mat).toUpperCase();
  if (label && hay.includes(label)) return true;
  return false;
}

export function gasoilMatchesEngin(
  row: Record<string, unknown>,
  filterMaterialId: string | undefined,
  materialsById: Map<string, RentalMaterial>,
) {
  if (!filterMaterialId) return true;
  const materialId = String(row.material_id ?? "");
  if (materialId === filterMaterialId) return true;
  const mat = materialsById.get(filterMaterialId);
  if (!mat) return false;
  const label = `${row.vehicle_label ?? ""} ${row.equipment_name ?? ""}`;
  return textMatchesMaterial(label, mat);
}

export function partsMatchesEngin(
  part: PartsUsage,
  filterMaterialId: string | undefined,
  materialsById: Map<string, RentalMaterial>,
) {
  if (!filterMaterialId) return true;
  const mat = materialsById.get(filterMaterialId);
  if (!mat) return false;
  return textMatchesMaterial(part.equipmentName, mat);
}
