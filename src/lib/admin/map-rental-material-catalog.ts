import type { MaterialCategory } from "@/components/admin/operations-types";

export function mapRentalMaterialRow(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    materialCategory: ((r.material_category as string) || "engin") as MaterialCategory,
    reference: (r.reference as string) || "",
    matricule: (r.matricule as string) || "",
    designation: r.designation as string,
    subCategory: (r.sub_category as string) || "",
    ownerName: (r.owner_name as string) || "",
    active: Boolean(r.active ?? true),
  };
}

export type RentalMaterialBody = {
  id?: string;
  materialCategory?: MaterialCategory;
  reference?: string;
  matricule?: string;
  designation?: string;
  subCategory?: string;
  ownerName?: string;
  active?: boolean;
};

export function materialLabel(m: {
  materialCategory: MaterialCategory;
  reference: string;
  matricule: string;
  designation: string;
}) {
  const id = m.reference || m.matricule;
  return id ? `${id} — ${m.designation}` : m.designation;
}
