import { jsPDF } from "jspdf";
import { defaultTemplate } from "@/components/admin/devis-types";
import type { GasoilBonExportData } from "@/lib/admin/gasoil-bon-export-data";

const NAVY: [number, number, number] = [26, 39, 68];
const SLATE: [number, number, number] = [71, 85, 105];
const BORDER: [number, number, number] = [26, 39, 68];

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const { readFile } = await import("fs/promises");
    const { join } = await import("path");
    const buf = await readFile(join(process.cwd(), "src/assets/barane-logo-stacked.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function drawCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  opts?: { bold?: boolean; size?: number; align?: "left" | "center" },
) {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.35);
  doc.rect(x, y, w, h);
  doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
  doc.setFontSize(opts?.size ?? 9);
  doc.setTextColor(...NAVY);
  const pad = 2;
  doc.text(text, x + (opts?.align === "center" ? w / 2 : pad), y + h / 2 + 1.5, {
    align: opts?.align ?? "left",
    maxWidth: w - pad * 2,
  });
}

function drawHeaderCell(doc: jsPDF, x: number, y: number, w: number, h: number, fr: string, ar: string) {
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.35);
  doc.rect(x, y, w, h);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...NAVY);
  doc.text(fr, x + w / 2, y + 4.5, { align: "center", maxWidth: w - 2 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...SLATE);
  doc.text(ar, x + w / 2, y + 9, { align: "center", maxWidth: w - 2 });
}

async function buildGasoilBonCommandePdf(data: GasoilBonExportData): Promise<jsPDF> {
  const COLORS = {
    navy: [26, 39, 68] as [number, number, number],
    navyDeep: [18, 28, 48] as [number, number, number],
    gold: [222, 122, 58] as [number, number, number],
    goldLight: [255, 248, 239] as [number, number, number],
    slate: [71, 85, 105] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],
    headerBg: [241, 245, 249] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  };

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = 14;
  const right = pageW - 14;
  const template = defaultTemplate;
  let y = 8;

  const logo = await loadLogoDataUrl();
  const logoW = 22;
  const logoH = 28;
  const contentLeft = left + logoW + 6;
  if (logo) doc.addImage(logo, "PNG", left, y, logoW, logoH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.navyDeep);
  doc.text(template.sellerName.toUpperCase(), contentLeft, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.slate);
  doc.text(template.sellerActivity, contentLeft, y + 13, { maxWidth: right - contentLeft - 4 });

  const headerBottom = Math.max(y + logoH, y + 18);
  y = headerBottom + 3;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.35);
  doc.line(left, y, right, y);
  y += 6;

  const boxW = 94;
  const boxX = right - boxW;
  const barW = 1.4;
  const padLeft = 5;
  const textX = boxX + barW + padLeft;
  const supplier = data.supplier !== "—" ? data.supplier : "—";
  const boxH = 22;
  doc.setFillColor(...COLORS.goldLight);
  doc.roundedRect(boxX, y, boxW, boxH, 2.5, 2.5, "F");
  doc.setFillColor(...COLORS.gold);
  doc.rect(boxX, y, barW, boxH, "F");
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.35);
  doc.roundedRect(boxX, y, boxW, boxH, 2.5, 2.5, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.gold);
  doc.text("FOURNISSEUR", textX, y + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.navy);
  doc.text(supplier, textX, y + 12, { maxWidth: boxW - barW - padLeft - 5 });
  y += boxH + 8;

  doc.setFillColor(...COLORS.gold);
  doc.rect(left, y - 2, 3, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.navyDeep);
  const titleSuffix = data.number ? ` N° ${data.number}` : "";
  doc.text(`BON DE COMMANDE GASOIL${titleSuffix}`, left + 6, y + 5);
  y += 14;

  const metaH = 14;
  const metaCols = [
    { label: "Numéro", value: data.number || "—", w: 32 },
    { label: "Date", value: data.bonDate, w: 32 },
    { label: "Chantier", value: data.chantier, w: 56 },
    { label: "Référence", value: data.notes !== "—" ? data.notes : "—", w: 40 },
  ];
  let mx = left;
  for (const col of metaCols) {
    doc.setFillColor(...COLORS.headerBg);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(mx, y, col.w, metaH, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.slate);
    doc.text(col.label.toUpperCase(), mx + col.w / 2, y + 4.5, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.navy);
    doc.text(col.value, mx + col.w / 2, y + 10.5, { align: "center", maxWidth: col.w - 4 });
    mx += col.w + 3;
  }
  y += metaH + 8;

  const tableTop = y;
  const headerH = 9;
  const c0 = left;
  const c1 = c0 + 22;
  const c2 = c1 + 128;
  const c3 = right;

  doc.setFillColor(...COLORS.navy);
  doc.rect(left, tableTop, right - left, headerH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.white);
  doc.text("Réf.", (c0 + c1) / 2, tableTop + 6, { align: "center" });
  doc.text("Désignation", (c1 + c2) / 2, tableTop + 6, { align: "center" });
  doc.text("Qté commandée", (c2 + c3) / 2, tableTop + 6, { align: "center" });

  const rowH = 12;
  const rowY = tableTop + headerH;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.rect(left, rowY, right - left, rowH);
  doc.line(c1, rowY, c1, rowY + rowH);
  doc.line(c2, rowY, c2, rowY + rowH);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.navy);
  doc.text("GASOIL", c0 + (c1 - c0) / 2, rowY + 7.5, { align: "center" });
  doc.text("Gasoil — approvisionnement chantier", c1 + 3, rowY + 7.5);
  doc.text(data.litres.replace(/\s*L$/, ""), c2 + (c3 - c2) / 2, rowY + 7.5, { align: "center" });
  y = rowY + rowH + 8;

  if (data.pumpMeter !== "—") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.slate);
    doc.text("Compteur pompe :", left, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.navy);
    doc.text(data.pumpMeter, left + 32, y);
    y += 6;
  }

  const footerY = pageH - 18;
  const centerX = (left + right) / 2;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(left, footerY - 3, right, footerY - 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.slate);
  doc.text(template.sellerAddress, centerX, footerY, { align: "center" });
  doc.text(template.sellerLegal, centerX, footerY + 4, { align: "center" });
  doc.text(template.sellerContact, centerX, footerY + 8, { align: "center" });

  return doc;
}

export async function buildGasoilBonPdf(data: GasoilBonExportData): Promise<jsPDF> {
  if (data.bonType === "achat") {
    return buildGasoilBonCommandePdf(data);
  }
  return buildGasoilBonSortiePdf(data);
}

async function buildGasoilBonSortiePdf(data: GasoilBonExportData): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = margin;

  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "PNG", margin, y, 22, 22);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...NAVY);
  doc.text("BON DE SORTIE GASOIL", pageW / 2, y + 8, { align: "center" });
  doc.setFontSize(10);
  doc.text(`N° ${data.number}`, pageW / 2, y + 15, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE);
  doc.text(data.bonTypeLabel, pageW / 2, y + 20, { align: "center" });

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text("Chantier :", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.chantier, margin + 22, y);
  y += 6;

  const colW = contentW / 5;
  const headerH = 12;
  const rowH = 14;
  const headers: [string, string][] = [
    ["Date", "التاريخ"],
    ["Équipement / Matricule", "المركبة / الترقيم"],
    ["Compteur (H/km)", "العداد"],
    ["Heure d'alimentation", "ساعة التزويد"],
    ["Nombre de litres", "عدد اللترات"],
  ];
  const values = [data.bonDate, data.equipment, data.pumpMeter, data.fuelTime, data.litres];

  for (let i = 0; i < 5; i++) {
    drawHeaderCell(doc, margin + i * colW, y, colW, headerH, headers[i][0], headers[i][1]);
  }
  y += headerH;
  for (let i = 0; i < 5; i++) {
    drawCell(doc, margin + i * colW, y, colW, rowH, values[i], { size: 8, align: "center" });
  }
  y += rowH + 8;

  const sigW = contentW / 3;
  const sigH = 28;
  const sigLabels: [string, string, string][] = [
    ["Conducteur", "الاسم العائلي و الشخصي للسائق", data.driver],
    ["Pompiste", "الاسم العائلي و الشخصي للمزود", data.pompiste],
    ["Responsable", "الاسم العائلي و الشخصي للمسؤول", data.supervisor],
  ];

  for (let i = 0; i < 3; i++) {
    const x = margin + i * sigW;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.35);
    doc.rect(x, y, sigW, sigH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NAVY);
    doc.text(`${sigLabels[i][0]} :`, x + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...SLATE);
    doc.text(sigLabels[i][1], x + 2, y + 9, { maxWidth: sigW - 4 });
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text(sigLabels[i][2], x + 2, y + 16, { maxWidth: sigW - 4 });
    doc.setFontSize(7);
    doc.setTextColor(...SLATE);
    doc.text("Signature :", x + 2, y + 22);
    doc.setLineWidth(0.2);
    doc.line(x + 2, y + 26, x + sigW - 2, y + 26);
  }

  y += sigH + 6;
  doc.setFontSize(7);
  doc.setTextColor(...SLATE);
  doc.text(`Catégorie : ${data.vehicleCategoryLabel}`, margin, y);
  doc.text("BARANE INVEST — Document généré automatiquement", pageW / 2, doc.internal.pageSize.getHeight() - 8, {
    align: "center",
  });

  return doc;
}

export async function gasoilBonPdfBytes(data: GasoilBonExportData): Promise<ArrayBuffer> {
  const doc = await buildGasoilBonPdf(data);
  return doc.output("arraybuffer");
}
