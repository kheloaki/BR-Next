import { jsPDF } from "jspdf";
import type { SituationEnginsBundle } from "@/lib/admin/situation-engins-types";
import { moneyInWordsFr } from "@/lib/admin/money-in-words-fr";
import { formatMad, formatDateFr } from "@/lib/admin/reports/report-formatters";
import {
  drawReportFooter,
  drawReportHeader,
  ensurePdfSpace,
  REPORT_COLORS,
} from "@/lib/admin/reports/report-branding";

const PAGE_TOP = 18;

function formatMoneyPdf(value: number) {
  return new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function drawSectionTitle(doc: jsPDF, left: number, y: number, title: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...REPORT_COLORS.navy);
  doc.text(title, left, y);
  return y + 5;
}

function drawDataTable(
  doc: jsPDF,
  left: number,
  right: number,
  y: number,
  headers: string[],
  rows: string[][],
  colWeights: number[],
  generatedAt: string,
): number {
  const tableW = right - left;
  const weights = colWeights;
  const total = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map((w) => (w / total) * tableW);

  doc.setFillColor(...REPORT_COLORS.headerBg);
  doc.rect(left, y, tableW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...REPORT_COLORS.navy);
  let x = left;
  for (let i = 0; i < headers.length; i++) {
    const alignRight = i >= headers.length - 2;
    doc.text(headers[i]!, x + (alignRight ? colWidths[i]! - 1 : 1), y + 4, alignRight ? { align: "right" } : undefined);
    x += colWidths[i]!;
  }
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...REPORT_COLORS.slate);
  if (rows.length === 0) {
    y = ensurePdfSpace(doc, y, 8, () => PAGE_TOP);
    doc.text("Aucune écriture sur la période.", left + 1, y + 3);
    return y + 8;
  }

  for (const row of rows) {
    y = ensurePdfSpace(doc, y, 7, () => PAGE_TOP);
    x = left;
    for (let i = 0; i < row.length; i++) {
      const alignRight = i >= row.length - 2;
      const text = doc.splitTextToSize(row[i] ?? "—", colWidths[i]! - 2);
      doc.text(text.slice(0, 2), x + (alignRight ? colWidths[i]! - 1 : 1), y + 3.5, alignRight ? { align: "right" } : undefined);
      x += colWidths[i]!;
    }
    y += 5.5;
  }
  return y + 3;
}

export async function situationEnginsPdfBytes(bundle: SituationEnginsBundle): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const left = 12;
  const right = pageW - 12;
  const { meta, activityRows, totals, deductions, payments } = bundle;

  let y = await drawReportHeader(
    doc,
    meta.template,
    meta.enginLabel ? "SITUATION ENGIN" : "SITUATION DE CHANTIER",
    [
      `N° ${meta.documentNumber}`,
      `Date : ${formatDateFr(meta.documentDate)}`,
      `Période : ${meta.periodLabel}`,
      meta.enginLabel ? `Engin : ${meta.enginLabel}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...REPORT_COLORS.navy);
  const chantierLine = `CHANTIER ${meta.project.code ? `${meta.project.code} — ` : ""}${meta.project.name.toUpperCase()}`;
  doc.text(chantierLine, left, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...REPORT_COLORS.slate);
  doc.text(`CLIENT / LOCATAIRE  ${meta.locataire}`, left, y);
  y += 4.5;
  doc.text(`LOUEUR  ${meta.loueur}`, left, y);
  y += 4.5;
  const driverLine = meta.driverCin
    ? `CONDUCTEUR  ${meta.driverName} — CIN ${meta.driverCin}`
    : `CONDUCTEUR  ${meta.driverName}`;
  doc.text(driverLine, left, y);
  y += 4.5;
  doc.text(`TYPE  ${meta.enginLabel ? "Situation engin" : "Situation mensuelle des engins"}`, left, y);
  y += 4.5;
  doc.text(`OBSERVATION  ${meta.observation}`, left, y, { maxWidth: right - left });
  y += 8;

  y = drawSectionTitle(doc, left, y, "Activité engin — location, gasoil, pièces");
  y = drawDataTable(
    doc,
    left,
    right,
    y,
    ["Date", "Type", "N°", "Matricule", "Désignation", "Qté", "PU", "Total", "Info"],
    activityRows.map((r) => [
      formatDateFr(r.date),
      r.kindLabel,
      r.documentNo || "—",
      r.matricule || "—",
      r.designation || "—",
      r.qtyLabel,
      r.unitPrice > 0 ? formatMoneyPdf(r.unitPrice) : "—",
      r.total > 0 ? formatMoneyPdf(r.total) : "—",
      r.info || "—",
    ]),
    [14, 14, 12, 16, 30, 12, 12, 14, 18],
    meta.generatedAt,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...REPORT_COLORS.slate);
  doc.text(`Total location HT : ${formatMad(totals.situationHt)}`, left, y);
  y += 4;
  doc.text(`Total transport départ HT : ${formatMad(totals.transportHt)}`, left, y);
  y += 4;
  doc.text(
    `Total gasoil : ${totals.gasoilLitres.toLocaleString("fr-FR")} L — ${formatMad(totals.gasoilCost)}`,
    left,
    y,
  );
  y += 4;
  doc.text(`Total pièces HT : ${formatMad(totals.partsHt)}`, left, y);
  y += 8;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...REPORT_COLORS.slate);
  doc.text("Arrêtée la présente situation à la somme de :", left, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...REPORT_COLORS.navy);
  doc.text(moneyInWordsFr(totals.situationHt), left, y, { maxWidth: right - left });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.text(`Chantier : ${meta.project.name}`, left, y);
  doc.text(`Total situation HT  ${formatMad(totals.situationHt)}`, right, y, { align: "right" });
  y += 8;

  for (const d of deductions) {
    doc.text(`${d.label}`, left, y);
    doc.text(`${d.beneficiary}  ${formatMad(d.amountHt)}`, right, y, { align: "right" });
    y += 5;
  }
  if (deductions.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("Reste à payer HT", left, y);
    doc.text(formatMad(totals.resteAPayerHt), right, y, { align: "right" });
    y += 8;
    doc.setFont("helvetica", "normal");
  }

  const paymentGroups = new Map<string, typeof payments>();
  for (const p of payments) {
    const list = paymentGroups.get(p.label) ?? [];
    list.push(p);
    paymentGroups.set(p.label, list);
  }

  for (const [label, group] of paymentGroups) {
    y = ensurePdfSpace(doc, y, 16, () => PAGE_TOP);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${label} déjà payé`, left, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("Date", left + 1, y);
    doc.text("Montant", left + 28, y);
    doc.text("Payé à", left + 58, y);
    doc.text("Payé par", left + 118, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    for (const p of group) {
      doc.text(formatDateFr(p.date), left + 1, y);
      doc.text(`${formatMad(p.amount)}`, left + 28, y);
      doc.text(p.paidTo, left + 58, y, { maxWidth: 56 });
      doc.text(p.paidBy, left + 118, y, { maxWidth: 56 });
      y += 4.5;
    }
    y += 4;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawReportFooter(doc, p, totalPages, meta.generatedAt);
  }

  const sigY = doc.internal.pageSize.getHeight() - 32;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...REPORT_COLORS.slate);
  doc.text("Établi par", left, sigY);
  doc.text("Validé par le client / responsable chantier", right - 70, sigY);
  doc.setFontSize(7);
  doc.text("Signature & cachet", left, sigY + 12);
  doc.text("Nom : ____________________________", right - 70, sigY + 8);
  doc.text("Signature & cachet", right - 70, sigY + 12);

  return new Uint8Array(doc.output("arraybuffer"));
}

export function situationEnginsFilename(
  projectCode: string | null | undefined,
  ext: "pdf" | "csv",
  enginLabel?: string,
) {
  const code = (projectCode || "CHANTIER").replace(/[^\w-]+/g, "-").toUpperCase();
  const enginSlug = enginLabel
    ? `_${enginLabel.replace(/[^\w-]+/g, "-").slice(0, 24)}`
    : "";
  const stamp = new Date().toISOString().slice(0, 10);
  return `${code}_situation-engins${enginSlug}_${stamp}.${ext}`;
}
