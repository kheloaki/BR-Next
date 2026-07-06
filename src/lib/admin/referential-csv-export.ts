import type { Product, QuoteDraft, Supplier } from "@/components/admin/devis-types";
import { DOCUMENT_LABELS } from "@/components/admin/devis-types";
import type {
  AdminProject,
  DepotType,
} from "@/components/admin/operations-types";
import {
  DEPOT_TYPE_LABELS,
  MATERIAL_CATEGORY_LABELS,
  PROJECT_STATUS_LABELS,
  RENTAL_LOCATION_MODE_LABELS,
} from "@/components/admin/operations-types";
import {
  adminCsvResponse,
  type AdminCsvMeta,
  type AdminExportFormat,
  type CsvColumn,
} from "@/lib/admin/admin-csv-export";
import { computeQuoteTotals } from "@/lib/admin/project-report-calculations";
import { SITE_PV_STATUS_LABELS, SITE_PV_TYPE_LABELS } from "@/lib/admin/site-pv-types";
import { SITE_REPORT_STATUS_LABELS, SITE_REPORT_TYPE_LABELS } from "@/lib/admin/site-report-types";
import type { SitePv } from "@/lib/admin/site-pv-types";
import type { SiteReport } from "@/lib/admin/site-report-types";
import type { FinanceCaisseClosing, FinanceDocument } from "@/lib/admin/finance-types";
import {
  FINANCE_DOCUMENT_TYPE_LABELS,
  FINANCE_PAYMENT_STATUS_LABELS,
} from "@/lib/admin/finance-types";

const ORG_NAME = "BARANE INVEST";

function metaBase(
  title: string,
  opts?: { subtitle?: string; filters?: AdminCsvMeta["filters"] },
): AdminCsvMeta {
  return {
    title: `BARANE INVEST — ${title}`,
    organization: ORG_NAME,
    subtitle: opts?.subtitle,
    filters: opts?.filters,
  };
}

const MEMBER_ROLE_LABELS: Record<string, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  financier: "Financier",
  accountant: "Comptable",
  project_manager: "Chef de projet",
  member: "Membre",
};

export function customersCsv(
  rows: Array<{ id: string; name: string; ice: string; city: string; address: string }>,
  format: AdminExportFormat = "csv",
) {
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Raison sociale", value: (r) => r.name },
    { header: "ICE", value: (r) => r.ice },
    { header: "Ville", value: (r) => r.city },
    { header: "Adresse", value: (r) => r.address },
  ];
  return adminCsvResponse("clients", metaBase("Carnet clients"), columns, rows, format);
}

export function suppliersCsv(
  rows: Supplier[],
  opts?: { supplyType?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<Supplier>[] = [
    { header: "Nom contact", value: (r) => r.supplierName },
    { header: "Société", value: (r) => r.companyName },
    { header: "ICE", value: (r) => r.ice ?? "" },
    { header: "Ville", value: (r) => r.city ?? "" },
    { header: "Adresse", value: (r) => r.address ?? "" },
    { header: "Contact", value: (r) => r.contact ?? "" },
    { header: "Banque", value: (r) => r.bankName ?? "" },
    { header: "RIB", value: (r) => r.rib ?? "" },
    { header: "Types fourniture", value: (r) => (r.supplyTypes ?? []).join(", ") },
  ];
  return adminCsvResponse(
    "fournisseurs",
    metaBase("Carnet fournisseurs", {
      filters: opts?.supplyType ? [{ label: "Type fourniture", value: opts.supplyType }] : undefined,
    }),
    columns,
    rows,
    opts?.format,
  );
}

export function productsCsv(
  rows: Product[],
  opts?: { category?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<Product>[] = [
    { header: "Référence", value: (r) => r.reference },
    { header: "Désignation", value: (r) => r.designation },
    { header: "Catégorie", value: (r) => r.category },
    { header: "Unité", value: (r) => r.unit },
    { header: "Prix unitaire (MAD)", value: (r) => r.unitPrice, type: "currency" },
  ];
  return adminCsvResponse(
    "catalogue-articles",
    metaBase("Catalogue articles", {
      filters: opts?.category ? [{ label: "Catégorie", value: opts.category }] : undefined,
    }),
    columns,
    rows,
    opts?.format,
  );
}

export function projectsCsv(
  rows: AdminProject[],
  opts?: { status?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<AdminProject>[] = [
    { header: "Code", value: (r) => r.code },
    { header: "Nom chantier", value: (r) => r.name },
    { header: "Client", value: (r) => r.clientName },
    { header: "Statut", value: (r) => PROJECT_STATUS_LABELS[r.status] ?? r.status },
    { header: "N° marché", value: (r) => r.marketNumber },
    { header: "Localisation", value: (r) => r.location },
    { header: "Adresse", value: (r) => r.address },
    { header: "Responsable", value: (r) => r.managerName },
    { header: "Date début", value: (r) => r.startDate ?? "", type: "date" },
    { header: "Date fin", value: (r) => r.endDate ?? "", type: "date" },
    { header: "Budget (MAD)", value: (r) => r.budgetMad, type: "currency", total: true },
  ];
  return adminCsvResponse(
    "projets-chantiers",
    metaBase("Projets / chantiers", {
      filters: opts?.status ? [{ label: "Statut", value: opts.status }] : undefined,
    }),
    columns,
    rows,
    opts?.format,
  );
}

type DepotRow = {
  id: string;
  name: string;
  address: string;
  depotType: DepotType;
  projectId: string | null;
  projectName?: string;
};

export function depotsCsv(rows: DepotRow[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<DepotRow>[] = [
    { header: "Nom dépôt", value: (r) => r.name },
    { header: "Type", value: (r) => DEPOT_TYPE_LABELS[r.depotType] ?? r.depotType },
    { header: "Chantier lié", value: (r) => r.projectName ?? "" },
    { header: "Adresse", value: (r) => r.address },
  ];
  return adminCsvResponse("depots", metaBase("Dépôts stock"), columns, rows, format);
}

type EmployeeRow = {
  id: string;
  cin: string;
  name: string;
  role: string;
  address: string;
  birthDate: string | null;
  defaultProjectName: string;
};

export function employeesCsv(rows: EmployeeRow[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<EmployeeRow>[] = [
    { header: "N° CIN", value: (r) => r.cin },
    { header: "Nom", value: (r) => r.name },
    { header: "Fonction", value: (r) => r.role },
    { header: "Date naissance", value: (r) => r.birthDate ?? "", type: "date" },
    { header: "Adresse", value: (r) => r.address },
    { header: "Chantier par défaut", value: (r) => r.defaultProjectName },
  ];
  return adminCsvResponse("personnel", metaBase("Répertoire personnel"), columns, rows, format);
}

type EquipmentRow = { id: string; name: string; type: string; active: boolean };

export function equipmentCsv(rows: EquipmentRow[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<EquipmentRow>[] = [
    { header: "Nom engin", value: (r) => r.name },
    { header: "Type", value: (r) => r.type },
    { header: "Actif", value: (r) => (r.active ? "Oui" : "Non") },
  ];
  return adminCsvResponse("engins", metaBase("Parc engins"), columns, rows, format);
}

export function quotesCsv(
  rows: QuoteDraft[],
  opts?: { documentType?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<QuoteDraft>[] = [
    {
      header: "Type document",
      value: (r) =>
        DOCUMENT_LABELS[(r.documentType ?? "devis") as keyof typeof DOCUMENT_LABELS] ??
        r.documentType ??
        "devis",
    },
    { header: "N° document", value: (r) => r.quoteNumber },
    { header: "Référence", value: (r) => r.reference },
    { header: "Client", value: (r) => r.clientName },
    { header: "ICE client", value: (r) => r.clientIce },
    { header: "Date", value: (r) => r.date, type: "date" },
    { header: "Échéance", value: (r) => r.dueDate ?? "", type: "date" },
    { header: "Nb lignes", value: (r) => r.items.length, type: "integer", total: true },
    {
      header: "Total HT (MAD)",
      value: (r) => computeQuoteTotals(r).ht,
      type: "currency",
      total: true,
    },
    {
      header: "Total TTC (MAD)",
      value: (r) => computeQuoteTotals(r).ttc,
      type: "currency",
      total: true,
    },
    { header: "N° traitement", value: (r) => r.traitementNumber ?? "" },
    { header: "Créé le", value: (r) => r.createdAt, type: "datetime" },
  ];
  return adminCsvResponse(
    "documents-commerciaux",
    metaBase("Documents commerciaux enregistrés", {
      filters: opts?.documentType
        ? [{ label: "Type", value: DOCUMENT_LABELS[opts.documentType as keyof typeof DOCUMENT_LABELS] ?? opts.documentType }]
        : undefined,
    }),
    columns,
    rows,
    opts?.format,
  );
}

type RentalMaterialRow = ReturnType<
  typeof import("@/lib/admin/map-rental-material-catalog").mapRentalMaterialRow
>;

export function rentalMaterialsCsv(rows: RentalMaterialRow[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<RentalMaterialRow>[] = [
    { header: "Catégorie", value: (r) => MATERIAL_CATEGORY_LABELS[r.materialCategory] ?? r.materialCategory },
    { header: "Référence", value: (r) => r.reference },
    { header: "Matricule", value: (r) => r.matricule },
    { header: "Désignation", value: (r) => r.designation },
    { header: "Sous-catégorie", value: (r) => r.subCategory },
    { header: "Loueur", value: (r) => r.ownerName },
    { header: "Conducteur", value: (r) => r.driverName },
    { header: "Mode location", value: (r) => RENTAL_LOCATION_MODE_LABELS[r.rentalMode] ?? r.rentalMode },
    { header: "Tarif journalier (MAD)", value: (r) => r.dailyRate, type: "currency" },
    { header: "Prix mensuel HT (MAD)", value: (r) => r.monthlyPriceHt, type: "currency" },
    { header: "Forfait HT (MAD)", value: (r) => r.forfaitPriceHt, type: "currency" },
    { header: "Transport (MAD)", value: (r) => r.transportPrice, type: "currency" },
    { header: "Actif", value: (r) => (r.active ? "Oui" : "Non") },
  ];
  return adminCsvResponse("materiel-location", metaBase("Catalogue matériel location"), columns, rows, format);
}

type OrgMemberRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
};

export function organizationMembersCsv(rows: OrgMemberRow[], format: AdminExportFormat = "csv") {
  const columns: CsvColumn<OrgMemberRow>[] = [
    { header: "Nom", value: (r) => r.displayName },
    { header: "E-mail", value: (r) => r.email },
    { header: "Rôle", value: (r) => MEMBER_ROLE_LABELS[r.role] ?? r.role },
    { header: "Statut", value: (r) => (r.status === "active" ? "Actif" : "Invité") },
    { header: "Ajouté le", value: (r) => r.createdAt, type: "datetime" },
  ];
  return adminCsvResponse("utilisateurs", metaBase("Utilisateurs organisation"), columns, rows, format);
}

export function sitePvListCsv(
  rows: SitePv[],
  opts?: { projectId?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<SitePv>[] = [
    { header: "N° PV", value: (r) => r.number },
    { header: "Type", value: (r) => SITE_PV_TYPE_LABELS[r.pvType] ?? r.pvType },
    { header: "Date", value: (r) => r.pvDate, type: "date" },
    { header: "Statut", value: (r) => SITE_PV_STATUS_LABELS[r.status] ?? r.status },
    { header: "Objet", value: (r) => r.object },
    { header: "Responsable", value: (r) => r.responsiblePerson },
    { header: "Échéance", value: (r) => r.deadline ?? "", type: "date" },
    { header: "Observations", value: (r) => r.observations },
    { header: "Décisions", value: (r) => r.decisions },
    { header: "Réserves", value: (r) => r.reserves },
    { header: "Créé le", value: (r) => r.createdAt, type: "datetime" },
  ];
  return adminCsvResponse(
    "proces-verbaux",
    metaBase("Procès-verbaux chantier"),
    columns,
    rows,
    opts?.format,
  );
}

export function siteReportsListCsv(
  rows: SiteReport[],
  opts?: { projectId?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<SiteReport>[] = [
    { header: "N° rapport", value: (r) => r.number },
    { header: "Type", value: (r) => SITE_REPORT_TYPE_LABELS[r.reportType] ?? r.reportType },
    { header: "Date", value: (r) => r.reportDate, type: "date" },
    { header: "Période du", value: (r) => r.periodFrom ?? "", type: "date" },
    { header: "Période au", value: (r) => r.periodTo ?? "", type: "date" },
    { header: "Statut", value: (r) => SITE_REPORT_STATUS_LABELS[r.status] ?? r.status },
    { header: "Activités", value: (r) => r.activities },
    { header: "Quantités", value: (r) => r.quantities },
    { header: "Blocages", value: (r) => r.blockers },
    { header: "Actions suivantes", value: (r) => r.nextActions },
    { header: "Notes", value: (r) => r.notes },
    { header: "Créé le", value: (r) => r.createdAt, type: "datetime" },
  ];
  return adminCsvResponse(
    "rapports-chantier",
    metaBase("Rapports chantier"),
    columns,
    rows,
    opts?.format,
  );
}

export function financeDocumentsListCsv(
  docs: FinanceDocument[],
  opts?: { title?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<FinanceDocument>[] = [
    { header: "Type", value: (r) => FINANCE_DOCUMENT_TYPE_LABELS[r.documentType] ?? r.documentType },
    { header: "N° document", value: (r) => r.documentNumber },
    { header: "Client", value: (r) => r.customerName ?? "" },
    { header: "Fournisseur", value: (r) => r.supplierName ?? "" },
    { header: "Chantier", value: (r) => r.projectName ?? "" },
    { header: "Date émission", value: (r) => r.issueDate, type: "date" },
    { header: "Échéance", value: (r) => r.dueDate ?? "", type: "date" },
    { header: "Montant HT (MAD)", value: (r) => r.amountHt, type: "currency", total: true },
    { header: "Montant TTC (MAD)", value: (r) => r.amountTtc, type: "currency", total: true },
    { header: "Payé (MAD)", value: (r) => r.paidAmount, type: "currency", total: true },
    { header: "Reste (MAD)", value: (r) => r.remainingAmount, type: "currency", total: true },
    { header: "Statut paiement", value: (r) => FINANCE_PAYMENT_STATUS_LABELS[r.paymentStatus] ?? r.paymentStatus },
    { header: "Notes", value: (r) => r.notes ?? "" },
  ];
  return adminCsvResponse(
    "documents-finance",
    metaBase(opts?.title ?? "Documents finance"),
    columns,
    docs,
    opts?.format,
  );
}

export function financeClosingsCsv(
  rows: FinanceCaisseClosing[],
  opts?: { accountId?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<FinanceCaisseClosing>[] = [
    { header: "Date clôture", value: (r) => r.closingDate, type: "date" },
    { header: "Compte", value: (r) => r.accountName ?? r.accountId },
    { header: "Solde ouverture (MAD)", value: (r) => r.openingBalance, type: "currency" },
    { header: "Encaissements (MAD)", value: (r) => r.totalIncome, type: "currency", total: true },
    { header: "Décaissements (MAD)", value: (r) => r.totalExpense, type: "currency", total: true },
    { header: "Solde théorique (MAD)", value: (r) => r.theoreticalBalance, type: "currency" },
    { header: "Solde compté (MAD)", value: (r) => r.countedBalance, type: "currency" },
    { header: "Écart (MAD)", value: (r) => r.difference, type: "currency", total: true },
    { header: "Notes", value: (r) => r.notes ?? "" },
    { header: "Clôturé le", value: (r) => r.createdAt, type: "datetime" },
  ];
  return adminCsvResponse(
    "clotures-caisse",
    metaBase("Clôtures caisse journalières"),
    columns,
    rows,
    opts?.format,
  );
}
