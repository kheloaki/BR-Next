import { jsPDF } from "jspdf";
import type { SiteReport } from "@/lib/admin/site-report-types";
import { SITE_REPORT_STATUS_LABELS, SITE_REPORT_TYPE_LABELS } from "@/lib/admin/site-report-types";
import { getDefaultOrganizationName } from "@/lib/admin/organization";
import { formatDateFr } from "@/lib/admin/date-time-fr";

export function siteReportPdfBytes(report: SiteReport, projectName?: string, orgName?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(orgName || getDefaultOrganizationName(), margin, y);
  y += 6;
  doc.setFontSize(11);
  doc.text(SITE_REPORT_TYPE_LABELS[report.reportType].toUpperCase(), margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `N° ${report.number} · ${formatDateFr(report.reportDate)} · ${SITE_REPORT_STATUS_LABELS[report.status]}`,
    margin,
    y,
  );
  y += 8;

  const period =
    report.periodFrom || report.periodTo
      ? `${report.periodFrom ? formatDateFr(report.periodFrom) : "—"} → ${report.periodTo ? formatDateFr(report.periodTo) : "—"}`
      : "—";
  doc.text(`Chantier : ${projectName || "—"}`, margin, y);
  y += 5;
  doc.text(`Période : ${period}`, margin, y);
  y += 8;

  function section(title: string, body: string) {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(body.trim() || "—", pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 6;
  }

  section("Activités réalisées", report.activities);
  section("Quantités", report.quantities);
  section("Blocages / difficultés", report.blockers);
  section("Prochaines actions", report.nextActions);
  if (report.notes.trim()) section("Notes", report.notes);

  return doc.output("arraybuffer");
}

export function siteReportPdfFilename(number: string) {
  return `${number.replace(/\//g, "-")}.pdf`;
}
