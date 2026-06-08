import type { ProjectReportBundle, ProjectReportModule } from "@/lib/admin/project-report-types";
import { REPORT_MODULE_LABELS } from "@/lib/admin/reports/report-labels";
import { formatDateFr, formatLitres, formatMad, formatPercent, formatQty } from "@/lib/admin/reports/report-formatters";
import { buildProjectReportTables, type ReportTable } from "@/lib/admin/reports/project-report-tables";

function xmlEsc(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(col: number, value: string, bold = false) {
  const style = bold ? ' ss:StyleID="Header"' : "";
  return `<Cell ss:Index="${col}"${style}><Data ss:Type="String">${xmlEsc(value)}</Data></Cell>`;
}

function dataRow(cells: string[]) {
  return `<Row>${cells.map((c, i) => cell(i + 1, c)).join("")}</Row>`;
}

function headerRow(cells: string[]) {
  return `<Row>${cells.map((c, i) => cell(i + 1, c, true)).join("")}</Row>`;
}

function tableSheetRows(table: ReportTable): string[] {
  const rows = [headerRow(table.headers)];
  for (const r of table.rows) {
    rows.push(dataRow(table.headers.map((_, i) => r[i] ?? "")));
  }
  if (table.rows.length === 0) {
    rows.push(dataRow(["Aucune écriture sur la période.", ...table.headers.slice(1).map(() => "")]));
  }
  return rows;
}

function colWidthsFor(table: ReportTable): number[] {
  const weights = table.weights ?? table.headers.map(() => 1);
  const base = 520;
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.round((w / total) * base));
}

function sheetXml(name: string, rows: string[], colWidths: number[]): string {
  const cols = colWidths.map((w) => `<Column ss:Width="${w}"/>`).join("");
  return `<Worksheet ss:Name="${xmlEsc(name.slice(0, 31))}"><Table>${cols}${rows.join("")}</Table></Worksheet>`;
}

function metaRows(bundle: ProjectReportBundle): string[] {
  const p = bundle.meta.project;
  return [
    headerRow(["Champ", "Valeur"]),
    dataRow(["Chantier", p.name]),
    dataRow(["Code", p.code || "—"]),
    dataRow(["Client", p.clientName || "—"]),
    dataRow(["Période", bundle.meta.periodLabel]),
    dataRow(["Édité le", formatDateFr(bundle.meta.generatedAt.slice(0, 10))]),
    dataRow(["", ""]),
  ];
}

function kpiRows(bundle: ProjectReportBundle): string[] {
  return [
    headerRow(["Indicateur", "Valeur"]),
    dataRow(["Litres gasoil", formatLitres(bundle.gasoil.totals.litresSortie)]),
    dataRow(["Coût gasoil", formatMad(bundle.gasoil.totals.costMad)]),
    dataRow(["Tonnage", formatQty(bundle.production.totals.tonnage, "t")]),
    dataRow(["Foration (m)", formatQty(bundle.production.totals.meters, "m")]),
    dataRow(["RH présents", String(bundle.personnel.totals.present)]),
    dataRow(["Pièces", formatMad(bundle.production.totals.partsCost)]),
    dataRow(["Location HT", formatMad(bundle.rentals.totals.ht)]),
    dataRow(["Achats DA", formatMad(bundle.purchases.totals.daTotal)]),
    dataRow(["Ventes HT", formatMad(bundle.facturation.totals.ht)]),
    dataRow(["Marge", formatMad(bundle.profitability.totals.margin)]),
    dataRow(["Marge %", formatPercent(bundle.profitability.totals.marginPct)]),
  ];
}

export function buildProjectReportExcelXml(module: ProjectReportModule, bundle: ProjectReportBundle): string {
  const sheets: string[] = [];
  sheets.push(sheetXml("Synthèse", [...metaRows(bundle), ...kpiRows(bundle)], [160, 200]));

  const tables = buildProjectReportTables(module, bundle);
  for (const table of tables) {
    const name = table.title || REPORT_MODULE_LABELS[module];
    sheets.push(sheetXml(name, tableSheetRows(table), colWidthsFor(table)));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/></Style>
 </Styles>
 ${sheets.join("\n")}
</Workbook>`;
}

export function projectReportExcelBytes(module: ProjectReportModule, bundle: ProjectReportBundle): Uint8Array {
  const xml = buildProjectReportExcelXml(module, bundle);
  return new TextEncoder().encode("\uFEFF" + xml);
}
