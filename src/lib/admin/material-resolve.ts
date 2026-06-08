import type { MaterialCategory } from "@/components/admin/operations-types";
import type { GasoilVehicleCategory } from "@/components/admin/operations-types";
import { materialLabel } from "@/lib/admin/map-rental-material-catalog";
import type { SupabaseClient } from "@supabase/supabase-js";

export function gasoilCategoryToMaterialCategory(category: GasoilVehicleCategory): MaterialCategory {
  if (category === "groupe_electrogene") return "groupe_electrogen";
  return category;
}

export async function resolveMaterialFields(
  supabase: SupabaseClient,
  organizationId: string,
  materialId?: string | null,
) {
  const id = materialId?.trim();
  if (!id) {
    return {
      material_id: null as string | null,
      equipment_name: "",
      vehicle_label: "",
    };
  }

  const { data } = await supabase
    .from("admin_rental_materials")
    .select("id, designation, reference, matricule, material_category")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) {
    return { material_id: null, equipment_name: "", vehicle_label: "" };
  }

  const row = data as {
    id: string;
    designation: string;
    reference: string;
    matricule: string;
    material_category: string;
  };

  const label = materialLabel({
    materialCategory: (row.material_category || "engin") as MaterialCategory,
    reference: row.reference || "",
    matricule: row.matricule || "",
    designation: row.designation || "",
  });

  return {
    material_id: row.id,
    equipment_name: label,
    vehicle_label: row.matricule?.trim() || row.reference?.trim() || "",
  };
}
