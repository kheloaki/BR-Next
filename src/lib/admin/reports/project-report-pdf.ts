import { jsPDF } from "jspdf";
import type { ProjectReportBundle, ProjectReportModule } from "@/lib/admin/project-report-types";
import { REPORT_MODULE_LABELS } from "@/lib/admin/reports/report-labels";
import {
  drawReportFooter,
  drawReportHeader,
  ensurePdfSpace,
  REPORT_COLORS,
} from "@/lib/admin/reports/report-branding";
import {
  formatLitres,
  formatMad,
  formatPercent,
  formatQty,
} from "@/lib/admin/reports/report-formatters";
import { buildProjectReportTables, type ReportTable } from "@/lib/admin/reports/project-report-tables";

const PAGE_TOP = 18;
const FONT_BODY = 7;
const FONT_HEADER = 7;
const LINE_H = 3.6;
const CELL_PAD = 2.5;

function subtitleFor(bundle: ProjectReportBundle): string {
  const p = bundle.meta.project;
  return [
    p.code && `Code ${p.code}`,
    p.clientName && `Client : ${p.clientName}`,
    bundle.meta.periodLabel,
  ]
    .filter(Boolean)
    .join(" · ");
}

function columnWidths(table: ReportTable, tableW: number): number[] {
  const weights = table.weights ?? table.headers.map(() => 1);
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => (w / total) * tableW);
}

function drawKpiBlock(doc: jsPDF, left: number, y: number, items: { label: string; value: string }[]) {
  const colW = 88;
  let x = left;
  let cy = y;
  items.forEach((item, i) => {
    if (i > 0 && i % 2 === 0) {
      cy += 14;
      x = left;
    }
    doc.setDrawColor(...REPORT_COLORS.border);
    doc.setFillColor(...REPORT_COLORS.white);
    doc.roundedRect(x, cy, colW, 12, 1, 1, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...REPORT_COLORS.slate);
    doc.text(item.label, x + 3, cy + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...REPORT_COLORS.navy);
    doc.text(item.value, x + 3, cy + 10, { maxWidth: colW - 6 });
    x += colW + 4;
  });
  return cy + 16;
}

function drawTableHeaderRow(
  doc: jsPDF,
  left: number,
  y: number,
  colWidths: number[],
  headers: string[],
): number {
  const headerH = 8;
  let x = left;
  for (let i = 0; i < headers.length; i++) {
    const w = colWidths[i]!;
    doc.setFillColor(...REPORT_COLORS.navy);
    doc.setDrawColor(...REPORT_COLORS.navy);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, headerH, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT_HEADER);
    doc.setTextColor(255, 255, 255);
    const lines = doc.splitTextToSize(headers[i] ?? "", w - 4);
    doc.text(lines.slice(0, 2), x + 2, y + 5.2);
    x += w;
  }
  return y + headerH;
}

function measureRow(
  doc: jsPDF,
  colWidths: number[],
  row: string[],
  colCount: number,
): { rowH: number; cells: string[][] } {
  doc.setFontSize(FONT_BODY);
  let maxLines = 1;
  const cells: string[][] = [];
  for (let i = 0; i < colCount; i++) {
    const lines = doc.splitTextToSize(String(row[i] ?? "—"), colWidths[i]! - 4);
    cells.push(lines);
    maxLines = Math.max(maxLines, lines.length);
  }
  const rowH = CELL_PAD * 2 + maxLines * LINE_H;
  return { rowH, cells };
}

function drawTableRow(
  doc: jsPDF,
  left: number,
  y: number,
  colWidths: number[],
  cells: string[][],
  rowH: number,
) {
  let x = left;
  for (let i = 0; i < cells.length; i++) {
    const w = colWidths[i]!;
    doc.setDrawColor(...REPORT_COLORS.border);
    doc.setFillColor(...REPORT_COLORS.white);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, rowH, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_BODY);
    doc.setTextColor(...REPORT_COLORS.slate);
    doc.text(cells[i]!, x + 2, y + CELL_PAD + 2.5);
    x += w;
  }
}

function drawReportTable(
  doc: jsPDF,
  left: number,
  right: number,
  startY: number,
  table: ReportTable,
): number {
  if (table.headers.length === 0) return startY;

  const tableW = right - left;
  const colWidths = columnWidths(table, tableW);
  let y = startY;

  if (table.title) {
    y = ensurePdfSpace(doc, y, 10, () => PAGE_TOP);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...REPORT_COLORS.navy);
    doc.text(table.title, left, y);
    y += 7;
  }

  const drawHeader = () => drawTableHeaderRow(doc, left, y, colWidths, table.headers);

  y = ensurePdfSpace(doc, y, 12, () => PAGE_TOP);
  y = drawHeader();

  if (table.rows.length === 0) {
    y = ensurePdfSpace(doc, y, 8, () => PAGE_TOP);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(FONT_BODY);
    doc.setTextColor(...REPORT_COLORS.slate);
    doc.text("Aucune écriture sur la période.", left, y + 4);
    return y + 10;
  }

  for (const row of table.rows) {
    const { rowH, cells } = measureRow(doc, colWidths, row, table.headers.length);
    const nextY = ensurePdfSpace(doc, y, rowH + 2, () => PAGE_TOP);
    if (nextY === PAGE_TOP) {
      y = nextY;
      y = drawHeader();
    } else {
      y = nextY;
    }
    drawTableRow(doc, left, y, colWidths, cells, rowH);
    y += rowH;
  }

  return y + 6;
}

export async function buildProjectReportPdf(
  module: ProjectReportModule,
  bundle: ProjectReportBundle,
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 14;
  const right = doc.internal.pageSize.getWidth() - 14;
  const title = REPORT_MODULE_LABELS[module];

  let y = await drawReportHeader(doc, bundle.meta.template, title, subtitleFor(bundle));

  if (module === "global") {
    y = drawKpiBlock(doc, left, y, [
      { label: "Litres gasoil", value: formatLitres(bundle.gasoil.totals.litresSortie) },
      { label: "Coût gasoil", value: formatMad(bundle.gasoil.totals.costMad) },
      { label: "Tonnage prod.", value: formatQty(bundle.production.totals.tonnage, "t") },
      { label: "Mètres forés", value: formatQty(bundle.production.totals.meters, "m") },
      { label: "RH présents", value: String(bundle.personnel.totals.present) },
      { label: "Pièces", value: formatMad(bundle.production.totals.partsCost) },
      { label: "Location HT", value: formatMad(bundle.rentals.totals.ht) },
      { label: "Marge", value: formatMad(bundle.profitability.totals.margin) },
    ]);
  }

  for (const table of buildProjectReportTables(module, bundle)) {
    if (module === "global" && table.title === "Synthèse indicateurs") continue;
    y = drawReportTable(doc, left, right, y, table);
  }

  if (module === "global" && bundle.profitability.totals.margin !== 0) {
    y = ensurePdfSpace(doc, y, 8, () => PAGE_TOP);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...REPORT_COLORS.navy);
    doc.text(
      `Marge nette : ${formatMad(bundle.profitability.totals.margin)} (${formatPercent(bundle.profitability.totals.marginPct)})`,
      left,
      y,
    );
    y += 8;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawReportFooter(doc, i, totalPages, bundle.meta.generatedAt);
  }

  return doc;
}

export async function projectReportPdfBytes(
  module: ProjectReportModule,
  bundle: ProjectReportBundle,
): Promise<ArrayBuffer> {
  const doc = await buildProjectReportPdf(module, bundle);
  return doc.output("arraybuffer");
}
