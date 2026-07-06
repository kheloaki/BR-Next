import type {
  AttendanceRecord,
  DrillingReport,
  FuelEntry,
  PartsUsage,
  ProductionEntry,
  PurchaseRequest,
  RentalContract,
  StockItem,
  Trip,
} from "@/components/admin/operations-types";
import {
  MATERIAL_CATEGORY_LABELS,
  PURCHASE_CATEGORY_LABELS,
  PURCHASE_STATUS_LABELS,
  STOCK_STATUS_LABELS,
} from "@/components/admin/operations-types";
import {
  adminCsvResponse,
  type AdminCsvMeta,
  type AdminExportFormat,
  type CsvColumn,
} from "@/lib/admin/admin-csv-export";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/admin/attendance-labels";
import { GASOIL_VEHICLE_CATEGORY_LABELS } from "@/lib/admin/gasoil-bon";
import type { MaterialUsageCostRow } from "@/lib/admin/material-fuel-usage";
import {
  formatBonLocationUsageDays,
  formatBonLocationUsageHours,
} from "@/lib/admin/map-rental-material";
import {
  TRAITEMENT_STATUS_LABELS,
  type Traitement,
  type TraitementType,
} from "@/lib/admin/traitement-types";

const ORG_NAME = "BARANE INVEST";

function isTraitementFinancePending(
  fin: Traitement["financeSummary"],
): fin is { pendingSync: true } {
  return Boolean(fin && "pendingSync" in fin && fin.pendingSync);
}

function metaBase(
  title: string,
  opts?: { period?: string; subtitle?: string; filters?: AdminCsvMeta["filters"] },
): AdminCsvMeta {
  return {
    title: `BARANE INVEST — ${title}`,
    organization: ORG_NAME,
    period: opts?.period,
    subtitle: opts?.subtitle,
    filters: opts?.filters,
  };
}

const FUEL_PRICE_SOURCE_LABELS: Record<string, string> = {
  bon: "Bon gasoil",
  movement: "Mouvement stock",
  stock: "Prix moyen stock",
  none: "Non valorisé",
};

export function stockInventoryCsv(
  items: StockItem[],
  opts?: { alertsOnly?: boolean; format?: AdminExportFormat },
) {
  const columns: CsvColumn<StockItem>[] = [
    { header: "Référence", value: (r) => r.reference },
    { header: "Code article", value: (r) => r.articleCode ?? "" },
    { header: "Désignation", value: (r) => r.designation },
    { header: "Catégorie", value: (r) => r.category },
    { header: "Unité", value: (r) => r.unit },
    { header: "Quantité", value: (r) => r.qty, type: "number", total: true },
    { header: "Seuil alerte", value: (r) => r.minQty, type: "number" },
    { header: "Prix unitaire (MAD)", value: (r) => r.unitPrice, type: "currency" },
    {
      header: "Valeur stock (MAD)",
      value: (r) => r.qty * r.unitPrice,
      type: "currency",
      total: true,
    },
    { header: "Statut", value: (r) => STOCK_STATUS_LABELS[r.status] ?? r.status },
  ];

  return adminCsvResponse(
    "stock-inventaire",
    metaBase("Inventaire stock", {
      subtitle: opts?.alertsOnly ? "Articles en alerte uniquement" : "Tous les articles (hors gasoil)",
      filters: opts?.alertsOnly ? [{ label: "Filtre", value: "Alertes stock" }] : undefined,
    }),
    columns,
    items,
    opts?.format,
  );
}

export function traitementsCsv(
  rows: Traitement[],
  opts?: { type?: TraitementType | null; format?: AdminExportFormat },
) {
  const typeLabel =
    opts?.type === "achat" ? "Achats" : opts?.type === "vente" ? "Ventes" : "Tous types";

  const columns: CsvColumn<Traitement>[] = [
    { header: "N° traitement", value: (r) => r.number },
    { header: "Type", value: (r) => (r.traitementType === "achat" ? "Achat" : "Vente") },
    { header: "Objet", value: (r) => r.label },
    { header: "Partenaire", value: (r) => r.partnerName },
    { header: "Statut", value: (r) => TRAITEMENT_STATUS_LABELS[r.status] ?? r.status },
    { header: "Nb lignes", value: (r) => r.lines.length, type: "integer", total: true },
    {
      header: "Qté totale",
      value: (r) => r.lines.reduce((s, l) => s + l.qty, 0),
      type: "number",
      total: true,
    },
    {
      header: "Montant lignes HT (MAD)",
      value: (r) => r.lines.reduce((s, l) => s + l.qty * l.unitPrice, 0),
      type: "currency",
      total: true,
    },
    {
      header: "BC / Devis",
      value: (r) => {
        const step = r.traitementType === "achat" ? r.steps.bc : r.steps.devis;
        return step?.docNumber || step?.status || "";
      },
    },
    { header: "BL", value: (r) => r.steps.bl?.docNumber || r.steps.bl?.status || "" },
    { header: "Facture", value: (r) => r.steps.f?.docNumber || r.steps.f?.status || "" },
    { header: "BR", value: (r) => r.steps.br?.docNumber || r.steps.br?.status || "" },
    {
      header: "TTC finance (MAD)",
      value: (r) => {
        const fin = r.financeSummary;
        if (!fin || isTraitementFinancePending(fin)) return "";
        return fin.amountTtc;
      },
      type: "currency",
      total: true,
    },
    {
      header: "Reste (MAD)",
      value: (r) => {
        const fin = r.financeSummary;
        if (!fin || isTraitementFinancePending(fin)) return "";
        return fin.remainingAmount;
      },
      type: "currency",
      total: true,
    },
    {
      header: "Paiement",
      value: (r) => {
        const fin = r.financeSummary;
        if (!fin) return "";
        if (isTraitementFinancePending(fin)) return "Non synchronisé";
        return fin.paymentStatus;
      },
    },
    { header: "Créé le", value: (r) => r.createdAt, type: "datetime" },
    { header: "Notes", value: (r) => r.notes },
  ];

  return adminCsvResponse(
    opts?.type === "achat" ? "traitements-achat" : opts?.type === "vente" ? "traitements-vente" : "traitements",
    metaBase(`Traitements commerciaux — ${typeLabel}`, {
      filters: [{ label: "Type", value: typeLabel }],
    }),
    columns,
    rows,
    opts?.format,
  );
}

export function fuelJournalCsv(rows: FuelEntry[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<FuelEntry>[] = [
    { header: "Date", value: (r) => r.entryDate, type: "date" },
    { header: "Heure", value: (r) => r.fuelTime ?? "" },
    { header: "N° bon", value: (r) => r.ticketNo },
    {
      header: "Catégorie véhicule",
      value: (r) => (r.vehicleCategory ? GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory] : ""),
    },
    { header: "Engin / véhicule", value: (r) => r.equipmentName },
    { header: "Litres", value: (r) => r.litres, type: "number", total: true },
    { header: "Prix unitaire (MAD/L)", value: (r) => r.unitPrice ?? 0, type: "currency" },
    { header: "Coût total (MAD)", value: (r) => r.totalAmount ?? 0, type: "currency", total: true },
    {
      header: "Source prix",
      value: (r) => (r.priceSource ? FUEL_PRICE_SOURCE_LABELS[r.priceSource] ?? r.priceSource : ""),
    },
    { header: "Chantier", value: (r) => r.siteName },
    { header: "Compteur début", value: (r) => r.meterStart ?? "", type: "number" },
    { header: "Compteur fin", value: (r) => r.meterEnd ?? "", type: "number" },
    { header: "Conducteur / pompiste", value: (r) => r.fueledBy },
    { header: "Notes", value: (r) => r.notes },
  ];

  return adminCsvResponse(
    "carburant-journal",
    metaBase("Journal carburant — bons de sortie", {
      subtitle: "Consommation gasoil par engin et chantier",
    }),
    columns,
    rows,
    format,
  );
}

export function purchaseRequestsCsv(
  rows: PurchaseRequest[],
  opts?: { format?: AdminExportFormat; gasoilOnly?: boolean },
) {
  const columns: CsvColumn<PurchaseRequest>[] = [
    { header: "N° DA", value: (r) => r.number },
    { header: "Catégorie", value: (r) => PURCHASE_CATEGORY_LABELS[r.category] ?? r.category },
    { header: "Objet", value: (r) => r.subject },
    { header: "Référence", value: (r) => r.reference },
    { header: "Désignation", value: (r) => r.designation },
    { header: "Unité", value: (r) => r.unit },
    { header: "Quantité", value: (r) => r.qty, type: "number" },
    { header: "Prix unitaire (MAD)", value: (r) => r.unitPrice, type: "currency" },
    { header: "Montant total (MAD)", value: (r) => r.totalAmount, type: "currency", total: true },
    { header: "Nb lignes", value: (r) => r.lines.length, type: "integer" },
    { header: "Fournisseur", value: (r) => r.supplier },
    { header: "Urgence", value: (r) => r.urgency },
    { header: "Date livraison", value: (r) => r.deliveryDate, type: "date" },
    { header: "Demandeur", value: (r) => r.requester },
    { header: "Statut", value: (r) => PURCHASE_STATUS_LABELS[r.status] ?? r.status },
    { header: "Date création", value: (r) => r.createdAt, type: "datetime" },
    { header: "Date approbation", value: (r) => r.approvedAt ?? "", type: "datetime" },
    { header: "Justification", value: (r) => r.justification },
  ];

  return adminCsvResponse(
    opts?.gasoilOnly ? "demandes-achat-gasoil" : "demandes-achat",
    metaBase("Demandes d'achat (DA)", {
      subtitle: opts?.gasoilOnly ? "DA gasoil uniquement" : "Toutes les demandes d'achat",
    }),
    columns,
    rows,
    opts?.format,
  );
}

export function attendanceCsv(
  rows: AttendanceRecord[],
  opts?: { month?: string; date?: string; format?: AdminExportFormat },
) {
  const period = opts?.date
    ? `Journée du ${opts.date}`
    : opts?.month
      ? `Mois ${opts.month}`
      : undefined;

  const columns: CsvColumn<AttendanceRecord>[] = [
    { header: "Date", value: (r) => r.recordDate, type: "date" },
    { header: "N° CIN / Matricule", value: (r) => r.matricule },
    { header: "Nom", value: (r) => r.employeeName },
    { header: "Fonction", value: (r) => r.role },
    { header: "Entrée", value: (r) => r.timeIn },
    { header: "Sortie", value: (r) => r.timeOut },
    { header: "Statut", value: (r) => ATTENDANCE_STATUS_LABELS[r.status] ?? r.status },
    { header: "Heures sup.", value: (r) => r.overtimeHours, type: "number", total: true },
    { header: "Chantier", value: (r) => r.siteName },
    { header: "Tâche", value: (r) => r.task },
    { header: "Notes", value: (r) => r.notes },
  ];

  return adminCsvResponse(
    "pointage",
    metaBase("Pointage personnel", { period }),
    columns,
    rows,
    opts?.format,
  );
}

export function drillingCsv(rows: DrillingReport[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<DrillingReport>[] = [
    { header: "Date", value: (r) => r.reportDate, type: "date" },
    { header: "Chantier", value: (r) => r.siteName },
    { header: "Foreuse", value: (r) => r.rigName },
    { header: "Opérateur", value: (r) => r.operatorName },
    { header: "Profondeur début (m)", value: (r) => r.depthStart, type: "number" },
    { header: "Profondeur fin (m)", value: (r) => r.depthEnd, type: "number" },
    { header: "Mètres forés", value: (r) => r.metersDrilled, type: "number", total: true },
    { header: "Objectif (m)", value: (r) => r.targetMeters, type: "number" },
    {
      header: "Avancement %",
      value: (r) => (r.targetMeters > 0 ? Math.round((r.metersDrilled / r.targetMeters) * 100) : 0),
      type: "percent",
    },
    { header: "Heures marche", value: (r) => r.runHours, type: "number", total: true },
    { header: "Heures arrêt", value: (r) => r.stopHours, type: "number", total: true },
    { header: "Diamètre (mm)", value: (r) => r.diameterMm ?? "", type: "number" },
    { header: "Incidents", value: (r) => r.incidents },
  ];

  return adminCsvResponse(
    "foration",
    metaBase("Rapports de foration"),
    columns,
    rows,
    format,
  );
}

export function productionCsv(rows: ProductionEntry[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<ProductionEntry>[] = [
    { header: "Date", value: (r) => r.entryDate, type: "date" },
    { header: "Chantier", value: (r) => r.siteName },
    { header: "Matériau", value: (r) => r.material },
    { header: "Tonnage produit", value: (r) => r.tonnage, type: "number", total: true },
    { header: "Objectif tonnage", value: (r) => r.targetTonnage, type: "number" },
    {
      header: "Avancement %",
      value: (r) => (r.targetTonnage > 0 ? Math.round((r.tonnage / r.targetTonnage) * 100) : 0),
      type: "percent",
    },
    { header: "Tonnage expédié", value: (r) => r.shippedTonnage, type: "number", total: true },
    { header: "Stock tonnage", value: (r) => r.stockTonnage, type: "number", total: true },
    { header: "Heures marche", value: (r) => r.runHours, type: "number", total: true },
    { header: "Heures arrêt", value: (r) => r.stopHours, type: "number", total: true },
    { header: "Motif arrêt", value: (r) => r.stopReason },
    { header: "Chef équipe", value: (r) => r.shiftLead },
    { header: "Notes", value: (r) => r.notes },
  ];

  return adminCsvResponse("production", metaBase("Saisie production"), columns, rows, format);
}

export function rentalsCsv(rows: RentalContract[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<RentalContract>[] = [
    { header: "N° bon location", value: (r) => r.bonLocationNo },
    { header: "Date", value: (r) => r.lineDate ?? "", type: "date" },
    { header: "Locataire", value: (r) => r.locataire },
    { header: "Loueur", value: (r) => r.ownerName },
    { header: "Catégorie", value: (r) => MATERIAL_CATEGORY_LABELS[r.materialCategory] ?? r.materialCategory },
    { header: "Matricule", value: (r) => r.matricule },
    { header: "Désignation", value: (r) => r.designation },
    { header: "Sous-catégorie", value: (r) => r.subCategory },
    { header: "Conducteur", value: (r) => r.driverName },
    { header: "Tarif journalier (MAD)", value: (r) => r.dailyRate, type: "currency" },
    { header: "Jours", value: (r) => formatBonLocationUsageDays(r), type: "number", total: true },
    { header: "Heures", value: (r) => formatBonLocationUsageHours(r), type: "number", total: true },
    { header: "Transport (MAD)", value: (r) => r.transportPrice, type: "currency", total: true },
    { header: "Gasoil (MAD)", value: (r) => r.gasoil, type: "currency", total: true },
    { header: "Total (MAD)", value: (r) => r.totalMad, type: "currency", total: true },
    { header: "Statut", value: (r) => r.status },
  ];

  return adminCsvResponse("bons-location", metaBase("Bons de location matériel"), columns, rows, format);
}

export function tripsCsv(rows: Trip[], format: AdminExportFormat = "csv") {
  const TRIP_STATUS_LABELS: Record<Trip["status"], string> = {
    delivered: "Livré",
    in_transit: "En transit",
    arrived: "Arrivé",
  };

  const columns: CsvColumn<Trip>[] = [
    { header: "Date", value: (r) => r.tripDate, type: "date" },
    { header: "Code véhicule", value: (r) => r.vehicleCode },
    { header: "Immatriculation", value: (r) => r.plate },
    { header: "Chauffeur", value: (r) => r.driverName },
    { header: "Départ", value: (r) => r.departure },
    { header: "Destination", value: (r) => r.destination },
    { header: "Type chargement", value: (r) => r.loadType },
    { header: "Distance (km)", value: (r) => r.distanceKm, type: "number", total: true },
    { header: "Bon livraison", value: (r) => r.deliveryNote },
    { header: "Statut", value: (r) => TRIP_STATUS_LABELS[r.status] ?? r.status },
  ];

  return adminCsvResponse("logistique-voyages", metaBase("Voyages logistique"), columns, rows, format);
}

export function partsUsageCsv(rows: PartsUsage[], format: AdminExportFormat = "csv") {
  const PARTS_TYPE_LABELS: Record<PartsUsage["usageType"], string> = {
    part: "Pièce",
    lubricant: "Lubrifiant",
  };

  const columns: CsvColumn<PartsUsage>[] = [
    { header: "Date", value: (r) => r.usageDate, type: "date" },
    { header: "Engin", value: (r) => r.equipmentName },
    { header: "Référence", value: (r) => r.reference },
    { header: "Désignation", value: (r) => r.designation },
    { header: "Type", value: (r) => PARTS_TYPE_LABELS[r.usageType] ?? r.usageType },
    { header: "Quantité", value: (r) => r.qty, type: "number", total: true },
    { header: "Prix unitaire (MAD)", value: (r) => r.unitPrice, type: "currency" },
    { header: "Coût total (MAD)", value: (r) => r.qty * r.unitPrice, type: "currency", total: true },
  ];

  return adminCsvResponse(
    "pieces-lubrifiants",
    metaBase("Consommation pièces et lubrifiants"),
    columns,
    rows,
    format,
  );
}

type GasoilBonRow = {
  number: string;
  bonType: string;
  bonDate: string;
  vehicleCategory?: string;
  equipmentName: string;
  siteName: string;
  litres: number;
  unitPrice: number;
  totalAmount: number;
  supplier: string;
  beneficiary: string;
  fuelTime: string;
  pumpMeter: number | null;
  notes: string;
};

export function gasoilBonsCsv(
  rows: GasoilBonRow[],
  opts?: {
    bonType?: string;
    format?: AdminExportFormat;
    filters?: AdminCsvMeta["filters"];
    subtitle?: string;
  },
) {
  const BON_TYPE_LABELS: Record<string, string> = { achat: "Achat", sortie: "Sortie" };
  const columns: CsvColumn<GasoilBonRow>[] = [
    { header: "N° bon", value: (r) => r.number },
    { header: "Type", value: (r) => BON_TYPE_LABELS[r.bonType] ?? r.bonType },
    { header: "Date", value: (r) => r.bonDate, type: "date" },
    { header: "Catégorie véhicule", value: (r) => r.vehicleCategory ?? "" },
    { header: "Engin / véhicule", value: (r) => r.equipmentName },
    { header: "Chantier", value: (r) => r.siteName },
    { header: "Litres", value: (r) => r.litres, type: "number", total: true },
    { header: "Prix unitaire (MAD/L)", value: (r) => r.unitPrice, type: "currency" },
    { header: "Montant total (MAD)", value: (r) => r.totalAmount, type: "currency", total: true },
    { header: "Fournisseur", value: (r) => r.supplier },
    { header: "Bénéficiaire", value: (r) => r.beneficiary },
    { header: "Heure", value: (r) => r.fuelTime },
    { header: "Compteur pompe", value: (r) => r.pumpMeter ?? "", type: "number" },
    { header: "Notes", value: (r) => r.notes },
  ];
  return adminCsvResponse(
    opts?.bonType === "achat" ? "bons-gasoil-achat" : opts?.bonType === "sortie" ? "bons-gasoil-sortie" : "bons-gasoil",
    {
      ...metaBase("Bons gasoil", {
        subtitle: opts?.subtitle,
        filters: opts?.filters,
      }),
    },
    columns,
    rows,
    opts?.format,
  );
}

type StockMovementRow = {
  movementDate: string;
  movementType: string;
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
  notes: string;
};

export function stockMovementsCsv(
  rows: StockMovementRow[],
  opts?: { itemId?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<StockMovementRow>[] = [
    { header: "Date", value: (r) => r.movementDate, type: "date" },
    { header: "Type mouvement", value: (r) => r.movementType },
    { header: "Référence", value: (r) => r.reference },
    { header: "Désignation", value: (r) => r.designation },
    { header: "Catégorie", value: (r) => r.category },
    { header: "Code article", value: (r) => r.articleCode },
    { header: "Unité", value: (r) => r.unit },
    { header: "Quantité", value: (r) => r.qty, type: "number", total: true },
    { header: "Prix unitaire (MAD)", value: (r) => r.unitPrice, type: "currency" },
    { header: "Total HT (MAD)", value: (r) => r.totalPriceHt, type: "currency", total: true },
    { header: "Stock après", value: (r) => r.stockAfter, type: "number" },
    { header: "Affectation", value: (r) => r.assignment },
    { header: "Bon sortie", value: (r) => r.exitVoucherNo },
    { header: "Demandeur", value: (r) => r.requester },
    { header: "Magasinier", value: (r) => r.storekeeper },
    { header: "Fournisseur", value: (r) => r.supplier },
    { header: "Bon livraison", value: (r) => r.deliveryNote },
    { header: "Chantier", value: (r) => r.siteName },
    { header: "Notes", value: (r) => r.notes },
  ];
  return adminCsvResponse(
    "mouvements-stock",
    metaBase("Historique mouvements stock"),
    columns,
    rows,
    opts?.format,
  );
}

export function materialConsumptionCsv(
  rows: MaterialUsageCostRow[],
  opts?: { from?: string; to?: string; format?: AdminExportFormat },
) {
  const period =
    opts?.from && opts?.to
      ? `Du ${opts.from} au ${opts.to}`
      : opts?.from
        ? `À partir du ${opts.from}`
        : opts?.to
          ? `Jusqu'au ${opts.to}`
          : undefined;
  const columns: CsvColumn<MaterialUsageCostRow>[] = [
    { header: "Matériel", value: (r) => r.label },
    { header: "Heures location", value: (r) => r.totalHours, type: "number", total: true },
    { header: "Litres gasoil", value: (r) => r.totalLitres, type: "number", total: true },
    { header: "Coût gasoil (MAD)", value: (r) => r.totalCostMad, type: "currency", total: true },
    { header: "Location HT (MAD)", value: (r) => r.totalRentalMad, type: "currency", total: true },
    { header: "L/h", value: (r) => r.litresPerHour ?? "", type: "number" },
    { header: "MAD/h gasoil", value: (r) => r.costPerHourMad ?? "", type: "currency" },
    { header: "MAD/h location", value: (r) => r.rentalMadPerHour ?? "", type: "currency" },
    { header: "Coût exploitation (MAD)", value: (r) => r.totalOperatingMad, type: "currency", total: true },
    { header: "MAD/h exploitation", value: (r) => r.operatingMadPerHour ?? "", type: "currency" },
    { header: "Litres non valorisés", value: (r) => r.unpricedLitres, type: "number", total: true },
  ];
  return adminCsvResponse(
    "analyse-consommation-materiel",
    metaBase("Analyse consommation & location matériel", { period }),
    columns,
    rows,
    opts?.format,
  );
}
