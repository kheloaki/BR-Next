import type { FinanceAccount, FinanceDocument, FinanceMovement } from "@/lib/admin/finance-types";
import {
  FINANCE_MOVEMENT_TYPE_LABELS,
  FINANCE_PAYMENT_METHOD_LABELS,
  FINANCE_PAYMENT_STATUS_LABELS,
} from "@/lib/admin/finance-types";
import {
  adminCsvResponse,
  type AdminCsvMeta,
  type AdminExportFormat,
  type CsvColumn,
  periodLabelFr,
} from "@/lib/admin/admin-csv-export";
import { formatDateFr } from "@/lib/admin/date-time-fr";

const ORG_NAME = "BARANE INVEST";

function metaBase(title: string, period?: string, filters?: AdminCsvMeta["filters"]): AdminCsvMeta {
  return {
    title: `BARANE INVEST — ${title}`,
    organization: ORG_NAME,
    period,
    filters,
  };
}

export function financeTreasuryCsv(
  accounts: FinanceAccount[],
  totals: { totalCash: number; totalBank: number; total: number },
  format: AdminExportFormat = "csv",
) {
  const columns: CsvColumn<FinanceAccount>[] = [
    { header: "Compte", value: (r) => r.name },
    { header: "Code", value: (r) => r.code },
    { header: "Type", value: (r) => (r.accountType === "cash" ? "Caisse" : "Banque") },
    { header: "Devise", value: (r) => r.currency },
    { header: "Banque", value: (r) => r.bankName ?? "" },
    { header: "RIB", value: (r) => r.rib ?? "" },
    { header: "IBAN", value: (r) => r.iban ?? "" },
    { header: "Solde d'ouverture (MAD)", value: (r) => r.openingBalance, type: "currency" },
    { header: "Solde actuel (MAD)", value: (r) => r.balance ?? 0, type: "currency", total: true },
    { header: "Actif", value: (r) => (r.isActive ? "Oui" : "Non") },
    { header: "Par défaut", value: (r) => (r.isDefault ? "Oui" : "Non") },
  ];

  return adminCsvResponse(
    "tresorerie",
    {
      ...metaBase("Trésorerie générale"),
      subtitle: `Total caisse: ${totals.totalCash.toLocaleString("fr-FR")} MAD · Total banque: ${totals.totalBank.toLocaleString("fr-FR")} MAD · Total: ${totals.total.toLocaleString("fr-FR")} MAD`,
    },
    columns,
    accounts,
    format,
  );
}

export function financeMovementsCsv(
  movements: FinanceMovement[],
  opts: { from?: string; to?: string; title?: string; subtitle?: string; format?: AdminExportFormat },
) {
  const columns: CsvColumn<FinanceMovement>[] = [
    { header: "Date", value: (r) => r.movementDate, type: "date" },
    { header: "Référence", value: (r) => r.reference },
    { header: "Type", value: (r) => FINANCE_MOVEMENT_TYPE_LABELS[r.movementType] ?? r.movementType },
    { header: "Montant (MAD)", value: (r) => r.amount, type: "currency", total: true },
    { header: "Compte", value: (r) => r.accountName ?? "" },
    { header: "Catégorie", value: (r) => r.categoryName ?? "" },
    { header: "Mode paiement", value: (r) => (r.paymentMethod ? FINANCE_PAYMENT_METHOD_LABELS[r.paymentMethod] : "") },
    { header: "Chantier", value: (r) => r.projectName ?? "" },
    { header: "Client", value: (r) => r.customerName ?? "" },
    { header: "Fournisseur", value: (r) => r.supplierName ?? "" },
    { header: "N° chèque", value: (r) => r.chequeNumber ?? "" },
    { header: "Réf. virement", value: (r) => r.virementRef ?? "" },
    { header: "Notes", value: (r) => r.notes ?? "" },
  ];

  return adminCsvResponse(
    "journal-finance",
    {
      ...metaBase(opts.title ?? "Journal des mouvements financiers", periodLabelFr(opts.from, opts.to)),
      subtitle: opts.subtitle,
    },
    columns,
    movements,
    opts.format,
  );
}

export function financeJournalCsv(
  rows: Array<{
    date: string;
    reference: string;
    type: string;
    category: string;
    amount: number;
    project: string;
    notes: string;
  }>,
  title: string,
  from: string,
  to: string,
  format: AdminExportFormat = "csv",
) {
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Date", value: (r) => r.date, type: "date" },
    { header: "Référence", value: (r) => r.reference },
    { header: "Type", value: (r) => r.type },
    { header: "Catégorie", value: (r) => r.category },
    { header: "Montant (MAD)", value: (r) => r.amount, type: "currency", total: true },
    { header: "Chantier", value: (r) => r.project },
    { header: "Notes", value: (r) => r.notes },
  ];

  return adminCsvResponse("journal-finance", metaBase(title, periodLabelFr(from, to)), columns, rows, format);
}

export function financeBalanceClientsCsv(
  rows: Array<{ customer: string; totalTtc: number; paid: number; remaining: number }>,
  format: AdminExportFormat = "csv",
) {
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Client", value: (r) => r.customer },
    { header: "Total TTC (MAD)", value: (r) => r.totalTtc, type: "currency", total: true },
    { header: "Encaissé (MAD)", value: (r) => r.paid, type: "currency", total: true },
    { header: "Reste à encaisser (MAD)", value: (r) => r.remaining, type: "currency", total: true },
  ];
  return adminCsvResponse("balance-clients", metaBase("Balance clients"), columns, rows, format);
}

export function financeImpayesCsv(
  docs: FinanceDocument[],
  format: AdminExportFormat = "csv",
) {
  const rows = docs.map((d) => ({
    client: d.customerName ?? "",
    numero: d.documentNumber,
    echeance: d.dueDate ? formatDateFr(d.dueDate) : "",
    montant: d.amountTtc,
    reste: d.remainingAmount,
    statut: FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus] ?? d.paymentStatus,
    chantier: d.projectName ?? "",
  }));
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Client", value: (r) => r.client },
    { header: "N° facture", value: (r) => r.numero },
    { header: "Échéance", value: (r) => r.echeance },
    { header: "Montant TTC (MAD)", value: (r) => r.montant, type: "currency", total: true },
    { header: "Reste (MAD)", value: (r) => r.reste, type: "currency", total: true },
    { header: "Statut", value: (r) => r.statut },
    { header: "Chantier", value: (r) => r.chantier },
  ];
  return adminCsvResponse("impayes-clients", metaBase("État des impayés clients"), columns, rows, format);
}

export function financeBalanceSuppliersCsv(
  rows: Array<{ supplier: string; totalTtc: number; paid: number; remaining: number }>,
  format: AdminExportFormat = "csv",
) {
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Fournisseur", value: (r) => r.supplier },
    { header: "Total TTC (MAD)", value: (r) => r.totalTtc, type: "currency", total: true },
    { header: "Payé (MAD)", value: (r) => r.paid, type: "currency", total: true },
    { header: "Reste à payer (MAD)", value: (r) => r.remaining, type: "currency", total: true },
  ];
  return adminCsvResponse("balance-fournisseurs", metaBase("Balance fournisseurs"), columns, rows, format);
}

export function financeDettesCsv(
  docs: FinanceDocument[],
  format: AdminExportFormat = "csv",
) {
  const rows = docs.map((d) => ({
    fournisseur: d.supplierName ?? "",
    numero: d.documentNumber,
    echeance: d.dueDate ? formatDateFr(d.dueDate) : "",
    montant: d.amountTtc,
    reste: d.remainingAmount,
    statut: FINANCE_PAYMENT_STATUS_LABELS[d.paymentStatus] ?? d.paymentStatus,
  }));
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Fournisseur", value: (r) => r.fournisseur },
    { header: "N° facture", value: (r) => r.numero },
    { header: "Échéance", value: (r) => r.echeance },
    { header: "Montant TTC (MAD)", value: (r) => r.montant, type: "currency", total: true },
    { header: "Reste à payer (MAD)", value: (r) => r.reste, type: "currency", total: true },
    { header: "Statut", value: (r) => r.statut },
  ];
  return adminCsvResponse("dettes-fournisseurs", metaBase("État des dettes fournisseurs"), columns, rows, format);
}

export function financeExpensesByCategoryCsv(
  rows: Array<{ category: string; amount: number }>,
  format: AdminExportFormat = "csv",
) {
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Catégorie", value: (r) => r.category },
    { header: "Montant (MAD)", value: (r) => r.amount, type: "currency", total: true },
  ];
  return adminCsvResponse("depenses-categorie", metaBase("Dépenses par catégorie"), columns, rows, format);
}

export function financeChequesCsv(
  rows: Array<{ date: string; chequeNumber: string | null; amount: number; account: string; reference: string }>,
  format: AdminExportFormat = "csv",
) {
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Date", value: (r) => r.date, type: "date" },
    { header: "N° chèque", value: (r) => r.chequeNumber ?? "" },
    { header: "Montant (MAD)", value: (r) => r.amount, type: "currency", total: true },
    { header: "Compte", value: (r) => r.account },
    { header: "Référence", value: (r) => r.reference },
  ];
  return adminCsvResponse("cheques", metaBase("État des chèques"), columns, rows, format);
}

export function financeVirementsCsv(
  rows: Array<{ date: string; virementRef: string; amount: number; account: string; type: string }>,
  format: AdminExportFormat = "csv",
) {
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Date", value: (r) => r.date, type: "date" },
    { header: "Réf. virement", value: (r) => r.virementRef },
    { header: "Montant (MAD)", value: (r) => r.amount, type: "currency", total: true },
    { header: "Compte", value: (r) => r.account },
    { header: "Type", value: (r) => r.type },
  ];
  return adminCsvResponse("virements", metaBase("État des virements"), columns, rows, format);
}

export function financeMonthlySituationCsv(
  report: { title: string; income: number; expense: number; net: number },
  month: string,
  format: AdminExportFormat = "csv",
) {
  const rows = [
    { indicateur: "Encaissements", montant: report.income },
    { indicateur: "Décaissements", montant: report.expense },
    { indicateur: "Solde net", montant: report.net },
  ];
  const columns: CsvColumn<(typeof rows)[number]>[] = [
    { header: "Indicateur", value: (r) => r.indicateur },
    { header: "Montant (MAD)", value: (r) => r.montant, type: "currency" },
  ];
  return adminCsvResponse(
    "situation-mensuelle",
    metaBase(report.title, `Mois ${month}`),
    columns,
    rows,
    format,
  );
}
