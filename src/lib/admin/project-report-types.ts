import type {
  AttendanceRecord,
  AdminProject,
  DrillingReport,
  FuelEntry,
  PartsUsage,
  ProductionEntry,
  PurchaseRequest,
  RentalContract,
  StockMovement,
  Trip,
} from "@/components/admin/operations-types";
import type { Traitement } from "@/lib/admin/traitement-types";
import type { DevisTemplate, QuoteDraft } from "@/components/admin/devis-types";

export type ProjectReportModule =
  | "global"
  | "gasoil"
  | "stock"
  | "rentals"
  | "personnel"
  | "production"
  | "purchases"
  | "facturation"
  | "profitability";

export type ProjectReportFormat = "json" | "pdf" | "excel" | "csv" | "html";

export type ProjectReportFilters = {
  organizationId: string;
  projectId: string;
  from?: string;
  to?: string;
  module?: ProjectReportModule;
};

export type GasoilBonReport = {
  id: string;
  number: string;
  bonType: "achat" | "sortie";
  bonDate: string;
  litres: number;
  unitPrice: number;
  totalAmount: number;
  supplier: string;
  equipmentName: string;
  vehicleLabel: string;
  siteName: string;
  projectId: string | null;
  deliveryNote: string;
  pumpMeter: number | null;
};

export type RentalMaterialReport = {
  id: string;
  reference: string;
  designation: string;
  ownerName: string;
  supplierId: string;
  dailyRate: number;
  vatRate: number;
  contractStartDate: string | null;
  contractEndDate: string | null;
  projectId: string | null;
};

export type ProfitabilityLine = {
  key: string;
  label: string;
  ht: number;
  kind: "cost" | "revenue";
};

export type ProjectReportBundle = {
  meta: {
    generatedAt: string;
    filters: ProjectReportFilters;
    project: AdminProject;
    template: DevisTemplate;
    periodLabel: string;
  };
  gasoil: {
    sorties: FuelEntry[];
    commandes: GasoilBonReport[];
    totals: { litresSortie: number; litresAchat: number; costMad: number; bonCount: number };
  };
  stock: {
    movements: StockMovement[];
    totals: { entrees: number; sorties: number; valeurHt: number; movementCount: number };
  };
  rentals: {
    contracts: RentalContract[];
    materials: RentalMaterialReport[];
    totals: { ht: number; tva: number; ttc: number; entryCount: number };
  };
  personnel: {
    attendance: AttendanceRecord[];
    totals: { present: number; absent: number; overtimeHours: number; entryCount: number };
  };
  production: {
    entries: ProductionEntry[];
    drilling: DrillingReport[];
    trips: Trip[];
    parts: PartsUsage[];
    totals: {
      tonnage: number;
      targetTonnage: number;
      meters: number;
      totalKm: number;
      partsCost: number;
      entryCount: number;
    };
  };
  purchases: {
    requests: PurchaseRequest[];
    traitements: Traitement[];
    totals: { daTotal: number; achatsHt: number; pendingCount: number; entryCount: number };
  };
  facturation: {
    documents: QuoteDraft[];
    traitementsVente: Traitement[];
    totals: { ht: number; tva: number; ttc: number; entryCount: number };
  };
  profitability: {
    lines: ProfitabilityLine[];
    totals: { costs: number; revenue: number; margin: number; marginPct: number };
  };
};

export type QuoteTotals = { ht: number; vat: number; ttc: number };
