import type { ProjectReportBundle, ProjectReportModule } from "@/lib/admin/project-report-types";
import { DOCUMENT_LABELS, type DocumentType } from "@/components/admin/devis-types";
import { computeQuoteTotals, traitementLinesTotal } from "@/lib/admin/project-report-calculations";
import { TRAITEMENT_STATUS_LABELS } from "@/lib/admin/traitement-types";
import {
  formatDateFr,
  formatLitres,
  formatMad,
  formatPercent,
  formatQty,
  str,
} from "@/lib/admin/reports/report-formatters";

export type ReportTable = {
  title?: string;
  headers: string[];
  rows: string[][];
  /** Relative column widths (optional). */
  weights?: number[];
};

function gasoilTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Gasoil",
    headers: ["Type", "N°", "Date", "Engin / véhicule", "Litres", "PU HT", "Total HT", "Fournisseur"],
    weights: [11, 14, 14, 32, 11, 12, 12, 22],
    rows: [
      ...bundle.gasoil.sorties.map((r) => [
        "Sortie",
        r.ticketNo,
        formatDateFr(r.entryDate),
        r.equipmentName || r.vehicleLabel || "—",
        str(r.litres),
        "",
        "",
        "",
      ]),
      ...bundle.gasoil.commandes.map((r) => [
        "Commande",
        r.number,
        formatDateFr(r.bonDate),
        r.equipmentName || r.vehicleLabel || "—",
        str(r.litres),
        r.unitPrice ? formatMad(r.unitPrice) : "",
        r.totalAmount ? formatMad(r.totalAmount) : "",
        r.supplier || "—",
      ]),
    ],
  };
}

function stockTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Stock — mouvements",
    headers: ["Date", "Type", "Réf.", "Désignation", "Qté", "PU HT", "Total HT", "N° BS"],
    weights: [12, 10, 12, 28, 10, 12, 12, 14],
    rows: bundle.stock.movements.map((m) => [
      formatDateFr(m.movementDate),
      m.movementType === "entry" ? "Entrée" : "Sortie",
      m.reference,
      m.designation,
      str(m.qty),
      formatMad(m.unitPrice),
      formatMad(m.totalPriceHt),
      m.exitVoucherNo || "—",
    ]),
  };
}

function rentalsTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Location matériel",
    headers: ["N° contrat", "Date", "Matériel", "Conducteur", "Tarif", "Total MAD"],
    weights: [14, 12, 30, 18, 12, 14],
    rows: bundle.rentals.contracts.map((r) => [
      r.contractNo || "—",
      formatDateFr(r.lineDate),
      r.designation || r.equipmentName || "—",
      r.driverName || "—",
      formatMad(r.dailyRate || r.hourlyRate),
      formatMad(r.totalMad),
    ]),
  };
}

function personnelTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Pointage",
    headers: ["Date", "N° CIN", "Nom", "Rôle", "Entrée", "Sortie", "Statut", "H. sup."],
    weights: [12, 12, 22, 14, 10, 10, 12, 10],
    rows: bundle.personnel.attendance.map((r) => [
      formatDateFr(r.recordDate),
      r.matricule,
      r.employeeName,
      r.role,
      r.timeIn || "—",
      r.timeOut || "—",
      r.status,
      str(r.overtimeHours),
    ]),
  };
}

function productionTables(bundle: ProjectReportBundle): ReportTable[] {
  return [
    {
      title: "Production",
      headers: ["Date", "Site", "Tonnage", "Cible", "Matière"],
      weights: [12, 22, 12, 12, 28],
      rows: bundle.production.entries.map((r) => [
        formatDateFr(r.entryDate),
        r.siteName || "—",
        str(r.tonnage),
        str(r.targetTonnage),
        r.material || "—",
      ]),
    },
    {
      title: "Foration",
      headers: ["Date", "Foreuse", "Opérateur", "Prof. début", "Prof. fin", "m forés"],
      weights: [12, 18, 22, 14, 14, 12],
      rows: bundle.production.drilling.map((r) => [
        formatDateFr(r.reportDate),
        r.rigName || "—",
        r.operatorName || "—",
        str(r.depthStart),
        str(r.depthEnd),
        str(r.metersDrilled),
      ]),
    },
  ];
}

function purchasesTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Demandes d'achat",
    headers: ["N°", "Date", "Objet", "Fournisseur", "Qté", "PU", "Total", "Statut"],
    weights: [12, 12, 24, 18, 8, 10, 12, 10],
    rows: bundle.purchases.requests.map((r) => [
      r.number,
      formatDateFr(r.createdAt.slice(0, 10)),
      r.subject,
      r.supplier || "—",
      str(r.qty),
      formatMad(r.unitPrice),
      formatMad(r.totalAmount),
      r.status,
    ]),
  };
}

function traitementsAchatTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Traitements achat",
    headers: ["N°", "Objet", "Fournisseur", "Articles", "Total HT", "Statut"],
    weights: [12, 28, 22, 10, 14, 14],
    rows: bundle.purchases.traitements.map((t) => [
      t.number,
      t.label,
      t.partnerName || "—",
      str(t.lines.length),
      formatMad(traitementLinesTotal(t.lines)),
      TRAITEMENT_STATUS_LABELS[t.status],
    ]),
  };
}

function facturationTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Facturation (documents)",
    headers: ["N°", "Type", "Date", "Client", "HT", "TVA", "TTC"],
    weights: [14, 14, 12, 26, 12, 10, 12],
    rows: bundle.facturation.documents.map((d) => {
      const t = computeQuoteTotals(d);
      return [
        d.quoteNumber,
        DOCUMENT_LABELS[(d.documentType ?? "devis") as DocumentType],
        formatDateFr(d.date),
        d.clientName || "—",
        formatMad(t.ht),
        formatMad(t.vat),
        formatMad(t.ttc),
      ];
    }),
  };
}

function traitementsVenteTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Traitements vente",
    headers: ["N°", "Objet", "Client", "Articles", "Total HT", "Statut"],
    weights: [12, 28, 22, 10, 14, 14],
    rows: bundle.facturation.traitementsVente.map((t) => [
      t.number,
      t.label,
      t.partnerName || "—",
      str(t.lines.length),
      formatMad(traitementLinesTotal(t.lines)),
      TRAITEMENT_STATUS_LABELS[t.status],
    ]),
  };
}

function profitabilityTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Compte de chantier",
    headers: ["Poste", "Type", "Montant HT"],
    weights: [50, 20, 30],
    rows: [
      ...bundle.profitability.lines.map((l) => [
        l.label,
        l.kind === "cost" ? "Coût" : "Recette",
        formatMad(l.ht),
      ]),
      ["Total coûts", "", formatMad(bundle.profitability.totals.costs)],
      ["Total recettes", "", formatMad(bundle.profitability.totals.revenue)],
      ["Marge", "", formatMad(bundle.profitability.totals.margin)],
      ["Marge %", "", formatPercent(bundle.profitability.totals.marginPct)],
    ],
  };
}

function globalSummaryTable(bundle: ProjectReportBundle): ReportTable {
  return {
    title: "Synthèse indicateurs",
    headers: ["Indicateur", "Valeur"],
    weights: [55, 45],
    rows: [
      ["Litres gasoil (sorties)", formatLitres(bundle.gasoil.totals.litresSortie)],
      ["Coût gasoil", formatMad(bundle.gasoil.totals.costMad)],
      ["Tonnage production", formatQty(bundle.production.totals.tonnage, "t")],
      ["Mètres forés", formatQty(bundle.production.totals.meters, "m")],
      ["Présences RH", str(bundle.personnel.totals.present)],
      ["Pièces (MAD)", formatMad(bundle.production.totals.partsCost)],
      ["Km logistique", formatQty(bundle.production.totals.totalKm, "km")],
      ["DA total", formatMad(bundle.purchases.totals.daTotal)],
      ["Location (HT)", formatMad(bundle.rentals.totals.ht)],
      ["Mouvements stock", str(bundle.stock.totals.movementCount)],
      ["Facturation (HT)", formatMad(bundle.facturation.totals.ht)],
      ["Marge chantier", formatMad(bundle.profitability.totals.margin)],
    ],
  };
}

export function buildProjectReportTables(
  module: ProjectReportModule,
  bundle: ProjectReportBundle,
): ReportTable[] {
  switch (module) {
    case "gasoil":
      return [gasoilTable(bundle)];
    case "stock":
      return [stockTable(bundle)];
    case "rentals":
      return [rentalsTable(bundle)];
    case "personnel":
      return [personnelTable(bundle)];
    case "production":
      return productionTables(bundle);
    case "purchases": {
      const tables = [purchasesTable(bundle)];
      if (bundle.purchases.traitements.length > 0) tables.push(traitementsAchatTable(bundle));
      return tables;
    }
    case "facturation": {
      const tables = [facturationTable(bundle)];
      if (bundle.facturation.traitementsVente.length > 0) tables.push(traitementsVenteTable(bundle));
      return tables;
    }
    case "profitability":
      return [profitabilityTable(bundle)];
    case "global":
    default: {
      const tables: ReportTable[] = [globalSummaryTable(bundle), profitabilityTable(bundle)];
      if (bundle.gasoil.sorties.length + bundle.gasoil.commandes.length > 0) tables.push(gasoilTable(bundle));
      if (bundle.stock.movements.length > 0) tables.push(stockTable(bundle));
      if (bundle.rentals.contracts.length > 0) tables.push(rentalsTable(bundle));
      return tables;
    }
  }
}

/** RFC 4180-style line parse for legacy callers. */
export function parseCsvText(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i]!;
    const next = csv[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch === "\r") {
      // skip
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function tableToCsv(table: ReportTable, delimiter = ";"): string {
  const escape = (v: string) => {
    const s = String(v ?? "");
    if (s.includes(delimiter) || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    table.headers.map(escape).join(delimiter),
    ...table.rows.map((r) => table.headers.map((_, i) => escape(r[i] ?? "")).join(delimiter)),
  ];
  return lines.join("\r\n");
}
