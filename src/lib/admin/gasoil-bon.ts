import type { GasoilBonType, GasoilVehicleCategory } from "@/components/admin/operations-types";

export const GASOIL_BON_TYPES: GasoilBonType[] = ["achat", "sortie"];

export const GASOIL_VEHICLE_CATEGORIES: GasoilVehicleCategory[] = [
  "engin",
  "camion",
  "voiture",
  "groupe_electrogene",
];

export const GASOIL_BON_TYPE_LABELS: Record<GasoilBonType, string> = {
  achat: "Bon d'achat",
  sortie: "Bon de sortie",
};

export const GASOIL_VEHICLE_CATEGORY_LABELS: Record<GasoilVehicleCategory, string> = {
  engin: "Engin",
  camion: "Camion",
  voiture: "Voiture",
  groupe_electrogene: "Groupe électrogène",
};
