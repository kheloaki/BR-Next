import type { jsPDF } from "jspdf";
import type { DevisTemplate } from "@/components/admin/devis-types";

import { REPORT_FOOTER_NOTE } from "@/lib/admin/reports/report-labels";

export const REPORT_COLORS = {
  navy: [26, 39, 68] as [number, number, number],
  navyDeep: [18, 28, 48] as [number, number, number],
  gold: [222, 122, 58] as [number, number, number],
  slate: [71, 85, 105] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  headerBg: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

export async function loadReportLogoDataUrl(): Promise<string | null> {
  try {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const buf = await readFile(join(process.cwd(), "src/assets/barane-logo-stacked.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function drawReportHeader(
  doc: jsPDF,
  template: DevisTemplate,
  title: string,
  subtitle: string,
): Promise<number> {
  const pageW = doc.internal.pageSize.getWidth();
  const left = 14;
  const right = pageW - 14;
  let y = 10;
  const logo = await loadReportLogoDataUrl();
  const logoW = 20;
  const logoH = 26;
  const contentLeft = left + logoW + 5;
  if (logo) doc.addImage(logo, "PNG", left, y, logoW, logoH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...REPORT_COLORS.navyDeep);
  doc.text(template.sellerName.toUpperCase(), contentLeft, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...REPORT_COLORS.slate);
  doc.text(template.sellerActivity, contentLeft, y + 11, { maxWidth: right - contentLeft });
  doc.text(template.sellerAddress, contentLeft, y + 15, { maxWidth: right - contentLeft });

  y = Math.max(y + logoH, y + 18) + 4;
  doc.setDrawColor(...REPORT_COLORS.border);
  doc.setLineWidth(0.35);
  doc.line(left, y, right, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...REPORT_COLORS.navy);
  doc.text(title, left, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...REPORT_COLORS.slate);
  doc.text(subtitle, left, y, { maxWidth: right - left });
  return y + 8;
}

/** Space reserved at page bottom for footer + signatures. */
export const PDF_CONTENT_BOTTOM = 48;

export function drawReportFooter(doc: jsPDF, pageNum: number, totalPages: number, generatedAt: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 14;
  const right = pageW - 14;
  const footerTop = pageH - PDF_CONTENT_BOTTOM + 4;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(...REPORT_COLORS.slate);
  doc.text(REPORT_FOOTER_NOTE, left, footerTop, { maxWidth: right - left });

  const y = pageH - 24;
  doc.setDrawColor(...REPORT_COLORS.border);
  doc.setLineWidth(0.25);
  doc.line(left, y, right, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...REPORT_COLORS.slate);
  doc.text(`Édité le ${new Date(generatedAt).toLocaleString("fr-MA")}`, left, y + 5);
  doc.text(`Page ${pageNum} / ${totalPages}`, right, y + 5, { align: "right" });

  const sigY = y + 10;
  const sigW = (right - left) / 3 - 4;
  for (let i = 0; i < 3; i++) {
    const x = left + i * (sigW + 6);
    doc.setDrawColor(...REPORT_COLORS.border);
    doc.rect(x, sigY, sigW, 10);
    const labels = ["Établi par", "Validé par", "Cachet"];
    doc.setFontSize(6.5);
    doc.text(labels[i]!, x + 2, sigY + 7);
  }
}

export function ensurePdfSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  onNewPage: () => number,
): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - PDF_CONTENT_BOTTOM) {
    doc.addPage();
    return onNewPage();
  }
  return y;
}
