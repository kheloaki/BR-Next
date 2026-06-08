export type StockStatus = "ok" | "low" | "out";

export type StockMovementType =
  | "entry"
  | "exit"
  | "return"
  | "transfer";

export type PurchaseRequestStatus = "pending" | "approved" | "rejected";

export type PurchaseCategory =
  | "parts"
  | "fuel"
  | "lubricants"
  | "epi"
  | "misc";

export type TripStatus = "delivered" | "in_transit" | "arrived";

export type AttendanceStatus =
  | "present"
  | "sick"
  | "unexcused"
  | "leave"
  | "mission"
  | "training";

export type PartsUsageType = "part" | "lubricant";

export type RentalEquipmentStatus = "active" | "maintenance" | "down";

export type MaterialCategory = "engin" | "camion" | "voiture" | "groupe_electrogen" | "other";

export type MaterialTransportMode = "" | "rendre" | "depart";

export type RentalLocationMode = "jour" | "mois" | "forfait";

export const RENTAL_LOCATION_MODE_LABELS: Record<RentalLocationMode, string> = {
  jour: "Par jour",
  mois: "Par mois",
  forfait: "Forfait contractuel",
};

export const RENTAL_HOURS_PER_DAY = 9;

/** @deprecated Use AdminProject — kept for gradual migration */
export interface AdminSite {
  id: string;
  name: string;
}

export type ProjectStatus = "draft" | "active" | "suspended" | "closed";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Brouillon",
  active: "En cours",
  suspended: "Suspendu",
  closed: "Clôturé",
};

export interface AdminProject {
  id: string;
  code: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  location: string;
  address: string;
  managerName: string;
  marketNumber: string;
  marketDescription: string;
  chantierDocumentUrl: string;
  planUrl: string;
  notes: string;
}

export type AdminProjectForm = Omit<AdminProject, "id">;

export type DepotType = "central" | "site" | "other";

export const DEPOT_TYPE_LABELS: Record<DepotType, string> = {
  central: "Central",
  site: "Sur chantier",
  other: "Autre",
};

export interface AdminDepot {
  id: string;
  name: string;
  address: string;
  depotType: DepotType;
  projectId: string | null;
  projectName?: string;
}

export interface ProjectSummary {
  project: AdminProject;
  fuel: { totalLitres: number; entryCount: number; recent: FuelEntry[] };
  production: { totalTonnage: number; targetTonnage: number; entryCount: number; recent: ProductionEntry[] };
  drilling: { totalMeters: number; entryCount: number; recent: DrillingReport[] };
  attendance: { presentCount: number; entryCount: number; recent: AttendanceRecord[] };
  parts: { totalCost: number; entryCount: number; recent: PartsUsage[] };
  trips: { totalKm: number; entryCount: number; recent: Trip[] };
  purchaseRequests: { pendingCount: number; totalAmount: number; entryCount: number; recent: PurchaseRequest[] };
  rentals: { totalMad: number; entryCount: number; recent: RentalContract[] };
  stock: { movementCount: number };
}

export interface AdminEquipment {
  id: string;
  name: string;
  type: string;
  active: boolean;
}

export interface AdminEmployee {
  id: string;
  matricule: string;
  name: string;
  role: string;
  defaultProjectId: string | null;
  defaultProjectName?: string;
}

export interface PersonnelCategory {
  id: string;
  name: string;
}

export interface MaterialDetailCategory {
  id: string;
  materialCategory: MaterialCategory;
  name: string;
}

export interface StockItem {
  id: string;
  productId?: string | null;
  reference: string;
  designation: string;
  category: string;
  articleCode: string;
  unit: string;
  qty: number;
  minQty: number;
  unitPrice: number;
  status: StockStatus;
}

import type { StockTraitementLink } from "@/lib/admin/stock-traitement-link";

export interface StockMovement {
  id: string;
  itemId: string;
  movementType: StockMovementType;
  movementDate: string;
  reference: string;
  designation: string;
  category: string;
  articleCode: string;
  unit: string;
  qty: number;
  unitPrice: number;
  totalPriceHt: number;
  stockAfter: number;
  assignment: string;
  exitVoucherNo: string;
  requester: string;
  storekeeper: string;
  supplier: string;
  deliveryNote: string;
  siteName: string;
  projectId: string | null;
  depotId: string | null;
  notes: string;
  createdAt: string;
  traitementLink: StockTraitementLink | null;
}

export interface PurchaseRequest {
  id: string;
  projectId: string | null;
  number: string;
  category: PurchaseCategory;
  subject: string;
  reference: string;
  designation: string;
  unit: string;
  productId: string | null;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  supplier: string;
  urgency: string;
  deliveryDate: string;
  justification: string;
  requester: string;
  status: PurchaseRequestStatus;
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  traitementId: string | null;
  pumpMeter: number | null;
  stockItemId: string | null;
  stockQtyAtRequest: number | null;
}

export type GasoilBonType = "achat" | "sortie";

export type GasoilVehicleCategory = "engin" | "camion" | "voiture" | "groupe_electrogene";

export type GasoilContactRole = "conducteur" | "pompiste";

export interface GasoilContact {
  id: string;
  role: GasoilContactRole;
  name: string;
  cin: string;
  jobTitle: string;
  projectIds: string[];
}

export interface GasoilBon {
  id: string;
  number: string;
  bonType: GasoilBonType;
  vehicleCategory: GasoilVehicleCategory;
  projectId: string | null;
  materialId: string | null;
  equipmentId: string | null;
  vehicleLabel: string;
  equipmentName: string;
  siteName: string;
  bonDate: string;
  litres: number;
  pumpMeter: number | null;
  supplier: string;
  beneficiary: string;
  driverContactId: string | null;
  pompisteContactId: string | null;
  fuelTime: string;
  deliveryNote: string;
  notes: string;
  fuelEntryId: string | null;
  unitPrice?: number;
  totalAmount?: number;
  traitementId?: string | null;
  createdAt: string;
}

export type FuelEntrySource = "bon";

export interface FuelEntry {
  id: string;
  materialId: string;
  equipmentId: string;
  equipmentName: string;
  vehicleLabel?: string;
  entryDate: string;
  litres: number;
  meterStart: number | null;
  meterEnd: number | null;
  siteName: string;
  projectId: string | null;
  fueledBy: string;
  ticketNo: string;
  notes: string;
  fuelTime?: string;
  bonType?: GasoilBonType;
  vehicleCategory?: GasoilVehicleCategory;
  source?: FuelEntrySource;
  /** Prix MAD/L enregistré sur le bon (variable par BC / sortie). */
  unitPrice?: number;
  totalAmount?: number;
  /** Origine du prix appliqué pour le coût (rapport consommation). */
  priceSource?: "bon" | "movement" | "stock" | "none";
}

export interface DrillingReport {
  id: string;
  reportDate: string;
  siteName: string;
  projectId: string | null;
  rigName: string;
  operatorName: string;
  depthStart: number;
  depthEnd: number;
  metersDrilled: number;
  targetMeters: number;
  runHours: number;
  stopHours: number;
  diameterMm: number | null;
  incidents: string;
}

export interface Trip {
  id: string;
  projectId: string | null;
  tripDate: string;
  vehicleCode: string;
  plate: string;
  driverName: string;
  departure: string;
  destination: string;
  loadType: string;
  distanceKm: number;
  deliveryNote: string;
  status: TripStatus;
}

export interface RentalMaterial {
  id: string;
  materialCategory: MaterialCategory;
  projectId: string | null;
  reference: string;
  matricule: string;
  designation: string;
  subCategory: string;
  ownerName: string;
  supplierId: string;
  employeeId: string | null;
  driverName: string;
  driverContactId: string | null;
  rentalMode: RentalLocationMode;
  contractStartDate: string | null;
  contractEndDate: string | null;
  contractOpenEnded: boolean;
  dailyRate: number;
  daysCount: number;
  monthlyPriceHt: number;
  forfaitPriceHt: number;
  vatRate: number;
  transportMode: MaterialTransportMode;
  transportPrice: number;
  active: boolean;
}

export type RentalUsageUnit = "jour" | "heure";

export interface RentalBonLine {
  lineDate: string;
  materialId: string;
  matricule: string;
  designation: string;
  dailyRate: number;
  /** Quantité d'usage — en jours (9 h) ou en heures selon usageUnit. */
  usageQty: number;
  usageUnit: RentalUsageUnit;
}

export interface RentalContract {
  id: string;
  materialId: string | null;
  projectId: string | null;
  locataire: string;
  materialCategory: MaterialCategory;
  reference: string;
  matricule: string;
  designation: string;
  subCategory: string;
  ownerName: string;
  employeeId: string | null;
  driverName: string;
  driverContactId: string | null;
  dailyRate: number;
  daysCount: number;
  estimatedHours: number;
  lineDate: string | null;
  gasoil: number;
  bonLines: RentalBonLine[];
  transportMode: MaterialTransportMode;
  transportPrice: number;
  equipmentName: string;
  bonLocationNo: string;
  /** @deprecated use bonLocationNo */
  contractNo: string;
  hourlyRate: number;
  hoursWorked: number;
  hoursStopped: number;
  hoursDown: number;
  totalMad: number;
  status: RentalEquipmentStatus;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  matricule: string;
  role: string;
  recordDate: string;
  timeIn: string;
  timeOut: string;
  status: AttendanceStatus;
  overtimeHours: number;
  siteName: string;
  projectId: string | null;
  task: string;
  notes: string;
}

export interface ProductionEntry {
  id: string;
  entryDate: string;
  siteName: string;
  projectId: string | null;
  tonnage: number;
  targetTonnage: number;
  material: string;
  runHours: number;
  stopHours: number;
  stopReason: string;
  shippedTonnage: number;
  stockTonnage: number;
  shiftLead: string;
  notes: string;
}

export interface PartsUsage {
  id: string;
  projectId: string | null;
  equipmentId: string;
  equipmentName: string;
  stockItemId: string | null;
  reference: string;
  designation: string;
  usageType: PartsUsageType;
  qty: number;
  unitPrice: number;
  usageDate: string;
}

export interface DashboardOpsStats {
  stockItems: number;
  stockAlerts: number;
  pendingPurchaseRequests: number;
  fuelLitresMonth: number;
  drillingMetersMonth: number;
  tripsMonth: number;
  activeEmployees: number;
  productionRate: number;
  partsUsageMonth: number;
  rentalEquipment: number;
}

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  entry: "Entrée en stock",
  exit: "Sortie de magasin",
  return: "Retour chantier",
  transfer: "Transfert entre sites",
};

export const STOCK_UNITS = ["PIECE", "L", "KG", "M", "M²", "ML", "T", "FORFAIT", "U"] as const;

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  engin: "Engin",
  camion: "Camion",
  voiture: "Voiture",
  groupe_electrogen: "Groupe électrogène",
  other: "Autre",
};

export const PURCHASE_CATEGORY_LABELS: Record<PurchaseCategory, string> = {
  parts: "Pièces",
  fuel: "Gasoil",
  lubricants: "Lubrifiants",
  epi: "EPI / Sécurité",
  misc: "Divers",
};

export const PURCHASE_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
};

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  ok: "En stock",
  low: "Stock bas",
  out: "Rupture",
};

export function computeStockStatus(qty: number, minQty: number): StockStatus {
  if (qty <= 0) return "out";
  if (qty < minQty) return "low";
  return "ok";
}
