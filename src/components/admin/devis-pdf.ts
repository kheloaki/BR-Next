import { jsPDF } from "jspdf";
import logoStacked from "@/assets/barane-logo-stacked.png";
import cachetSignature from "@/assets/barane-cachet-signature.png";
import {
  DOCUMENT_LABELS,
  type DevisTemplate,
  type QuoteDraft,
} from "@/components/admin/devis-types";

/** BARANE brand palette for PDF (RGB) */
const COLORS = {
  navy: [26, 39, 68] as [number, number, number],
  navyDeep: [18, 28, 48] as [number, number, number],
  gold: [222, 122, 58] as [number, number, number],
  goldLight: [255, 248, 239] as [number, number, number],
  slate: [71, 85, 105] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  headerBg: [241, 245, 249] as [number, number, number],
  rowAlt: [249, 250, 251] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
};

async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function money(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateShort(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const yy = String(parsed.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

type PdfCtx = {
  doc: jsPDF;
  left: number;
  right: number;
  pageW: number;
};

function setFill(doc: jsPDF, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function setDraw(doc: jsPDF, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function setText(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function drawHRule(ctx: PdfCtx, y: number, thickness = 0.35) {
  const { doc, left, right } = ctx;
  setDraw(doc, COLORS.gold);
  doc.setLineWidth(thickness);
  doc.line(left, y, right, y);
}

function formatActivityLine(activity: string) {
  return activity
    .toUpperCase()
    .replace(/\s*-\s*/g, "  ·  ")
    .replace(/\s+/g, " ")
    .trim();
}

function maxLineWidth(doc: jsPDF, lines: string[]) {
  let max = 0;
  for (const line of lines) {
    max = Math.max(max, doc.getTextWidth(line));
  }
  return max;
}

/** Centered company identity — larger type, panel fits content width */
function drawCompanyBrand(ctx: PdfCtx, template: DevisTemplate, top: number, contentLeft: number) {
  const { doc, right } = ctx;
  const areaLeft = contentLeft;
  const areaRight = right - 2;
  const areaCenterX = (areaLeft + areaRight) / 2;
  const panelY = top;
  const padX = 6;
  const padTop = 3;
  const padBottom = 2.5;
  const nameSize = 18;
  const activitySize = 10;
  const nameLineH = 6.5;
  const activityLineH = 4.2;
  const maxAvailW = areaRight - areaLeft;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameSize);
  const nameLines = doc.splitTextToSize(
    template.sellerName.toUpperCase(),
    maxAvailW - padX * 2,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(activitySize);
  const activity = formatActivityLine(template.sellerActivity);
  const activityLines = doc.splitTextToSize(activity, maxAvailW - padX * 2);

  const contentW = Math.max(maxLineWidth(doc, nameLines), maxLineWidth(doc, activityLines));
  const panelW = Math.min(maxAvailW, contentW + padX * 2);
  let panelX = areaCenterX - panelW / 2;
  panelX = Math.max(areaLeft, Math.min(panelX, areaRight - panelW));
  const centerX = panelX + panelW / 2;

  const nameY = panelY + padTop + 5;
  const accentY = nameY + nameLines.length * nameLineH + 1.5;
  const tagY = accentY + 3.5;
  const panelH = tagY + activityLines.length * activityLineH + padBottom - panelY;

  setFill(doc, [250, 251, 253]);
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(panelX, panelY, panelW, panelH, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameSize);
  setText(doc, COLORS.navyDeep);
  doc.text(nameLines, centerX, nameY, { align: "center" });

  const halfSpan = 14;
  setDraw(doc, COLORS.gold);
  doc.setLineWidth(0.45);
  doc.line(centerX - halfSpan, accentY, centerX - 2.5, accentY);
  doc.line(centerX + 2.5, accentY, centerX + halfSpan, accentY);
  setFill(doc, COLORS.gold);
  doc.circle(centerX, accentY, 0.9, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(activitySize);
  setText(doc, COLORS.slate);
  doc.text(activityLines, centerX, tagY, { align: "center" });

  return panelY + panelH;
}

function drawClientBox(
  ctx: PdfCtx,
  draft: QuoteDraft,
  boxX: number,
  boxY: number,
  boxW: number,
) {
  const { doc } = ctx;
  const barW = 1.4;
  const padLeft = 5;
  const padRight = 5;
  const textX = boxX + barW + padLeft;
  const textMaxW = boxW - barW - padLeft - padRight;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  const nameLines = doc.splitTextToSize(draft.clientName || "—", textMaxW);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const iceLine = `ICE : ${draft.clientIce || "—"}`;
  const addrLines = draft.clientAddress
    ? doc.splitTextToSize(draft.clientAddress, textMaxW)
    : [];

  const boxH =
    draft.clientAddress
      ? 11 + nameLines.length * 4 + 4 + 4 + addrLines.length * 3.8 + 5
      : 11 + nameLines.length * 4 + 4 + 5;

  setFill(doc, COLORS.goldLight);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2.5, 2.5, "F");
  setFill(doc, COLORS.gold);
  doc.rect(boxX, boxY, barW, boxH, "F");
  setDraw(doc, COLORS.gold);
  doc.setLineWidth(0.35);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setText(doc, COLORS.gold);
  doc.text(isPurchaseOrder(draft) ? "FOURNISSEUR" : "CLIENT", textX, boxY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  setText(doc, COLORS.navy);
  doc.text(nameLines, textX, boxY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLORS.slate);
  doc.text(iceLine, textX, boxY + 11 + nameLines.length * 4);

  if (draft.clientAddress) {
    const addrY = boxY + 11 + nameLines.length * 4 + 4;
    doc.text(addrLines, textX, addrY);
  }

  return boxH;
}

function drawHeader(ctx: PdfCtx, template: DevisTemplate, draft: QuoteDraft, logoDataUrl: string | null) {
  const { doc, left, right } = ctx;
  const top = 8;
  const logoW = 22;
  const logoH = 28;
  const contentLeft = left + logoW + 6;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", left, top, logoW, logoH);
    } catch {
      // continue without logo
    }
  }

  const brandBottom = drawCompanyBrand(ctx, template, top, contentLeft);
  const headerRowBottom = Math.max(top + logoH, brandBottom);
  drawHRule(ctx, headerRowBottom + 2);

  const boxW = 94;
  const boxX = right - boxW;
  const boxY = headerRowBottom + 6;
  const boxH = drawClientBox(ctx, draft, boxX, boxY, boxW);

  return boxY + boxH + 4;
}

function isPurchaseOrder(draft: QuoteDraft) {
  return draft.documentType === "bon_commande";
}

function drawTitleBlock(ctx: PdfCtx, draft: QuoteDraft, startY: number) {
  const { doc, left } = ctx;
  const documentType = draft.documentType ?? "devis";
  const documentLabel = DOCUMENT_LABELS[documentType];
  const titleSuffix = draft.quoteNumber ? ` N° ${draft.quoteNumber}` : "";
  const y = startY + 6;

  setFill(doc, COLORS.gold);
  doc.rect(left, y - 2, 3, 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  setText(doc, COLORS.navyDeep);
  doc.text(`${documentLabel}${titleSuffix}`, left + 6, y + 5);
  return y + 12;
}

function drawMetaRow(ctx: PdfCtx, draft: QuoteDraft, startY: number) {
  const { doc, left } = ctx;
  const y = startY;
  const h = 14;
  const cols = [
    { label: "Numéro", value: draft.quoteNumber || "—", w: 32 },
    { label: "Date", value: formatDateShort(draft.date), w: 32 },
    { label: "Référence", value: draft.reference || "—", w: 56 },
  ];
  let x = left;
  for (const col of cols) {
    setFill(doc, COLORS.headerBg);
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, col.w, h, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setText(doc, COLORS.slate);
    doc.text(col.label.toUpperCase(), x + col.w / 2, y + 4.5, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setText(doc, COLORS.navy);
    doc.text(col.value, x + col.w / 2, y + 10.5, { align: "center" });
    x += col.w + 3;
  }
  return y + h + 4;
}

function drawItemsTable(
  ctx: PdfCtx,
  draft: QuoteDraft,
  tableTop: number,
  tableBottom: number,
) {
  const { doc, left, right } = ctx;
  const c0 = left;
  const c1 = c0 + 22;
  const c2 = c1 + 78;
  const c3 = c2 + 16;
  const c4 = c3 + 22;
  const c5 = c4 + 14;
  const c6 = right;
  const headerH = 9;

  setFill(doc, COLORS.navy);
  doc.rect(left, tableTop, right - left, headerH, "F");
  const headers = [
    { x: (c0 + c1) / 2, t: "Réf." },
    { x: (c1 + c2) / 2, t: "Désignation" },
    { x: (c2 + c3) / 2, t: "Qté" },
    { x: (c3 + c4) / 2, t: "P.U." },
    { x: (c4 + c5) / 2, t: "Rem." },
    { x: (c5 + c6) / 2, t: "Montant HT" },
  ];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setText(doc, COLORS.white);
  for (const h of headers) {
    doc.text(h.t, h.x, tableTop + 6, { align: "center" });
  }

  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.2);
  doc.rect(left, tableTop + headerH, right - left, tableBottom - tableTop - headerH);

  let y = tableTop + headerH + 6;
  let rowIndex = 0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  for (const item of draft.items) {
    if (y > tableBottom - 5) break;

    if (item.isNote) {
      const noteText = item.designation || "";
      const wrapped = doc.splitTextToSize(noteText, right - left - 8);
      const noteHeight = Math.max(7, wrapped.length * 4.2 + 3);
      const noteTop = y - 4;
      setFill(doc, COLORS.goldLight);
      doc.rect(left + 0.5, noteTop, right - left - 1, noteHeight, "F");
      setFill(doc, COLORS.gold);
      doc.rect(left + 0.5, noteTop, 2, noteHeight, "F");
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(8);
      setText(doc, COLORS.slate);
      doc.text(wrapped, left + 5, y);
      doc.setFont("helvetica", "normal");
      setText(doc, COLORS.text);
      y += noteHeight + 1;
      continue;
    }

    if (rowIndex % 2 === 1) {
      setFill(doc, COLORS.rowAlt);
      doc.rect(left + 0.5, y - 4.5, right - left - 1, 8, "F");
    }
    rowIndex++;

    const descY = Math.min(y, tableBottom - 4);
    const amount = item.qty * item.unitPrice;
    const wrapped = doc.splitTextToSize(item.designation, c2 - c1 - 3);
    setText(doc, COLORS.navy);
    doc.setFont("helvetica", "bold");
    doc.text(item.reference || "—", c0 + 2, descY);
    doc.setFont("helvetica", "normal");
    setText(doc, COLORS.text);
    doc.text(wrapped, c1 + 2, descY);
    doc.text(money(item.qty), c2 + 2, descY);
    doc.text(money(item.unitPrice), c3 + 2, descY);
    doc.text(money(0), c4 + 2, descY);
    doc.setFont("helvetica", "bold");
    setText(doc, COLORS.navy);
    doc.text(money(amount), c5 + 2, descY);
    doc.setFont("helvetica", "normal");
    y += Math.max(7.5, wrapped.length * 4.1);
  }

  [c1, c2, c3, c4, c5].forEach((x) => {
    setDraw(doc, COLORS.border);
    doc.line(x, tableTop + headerH, x, tableBottom);
  });
}

function drawTotals(
  ctx: PdfCtx,
  draft: QuoteDraft,
  totals: { totalHt: number; netHt: number; vatAmount: number; totalTtc: number; netToPay: number },
  bottomY: number,
) {
  const { doc, left, right } = ctx;

  const gap = 12;
  const rowH = 22;
  const lvX = left;
  const lvW = 64;
  const rvX = lvX + lvW + gap;
  const rvW = right - rvX;

  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(lvX, bottomY, lvW, rowH + 14, 2, 2);
  doc.line(lvX, bottomY + 8, lvX + lvW, bottomY + 8);
  const l1 = lvX + 22;
  const l2 = lvX + 42;
  [l1, l2].forEach((x) => {
    setDraw(doc, COLORS.border);
    doc.line(x, bottomY, x, bottomY + rowH + 14);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setText(doc, COLORS.slate);
  doc.text("BASE HT", lvX + 2, bottomY + 5.5);
  doc.text("TAUX", l1 + 2, bottomY + 5.5);
  doc.text("TVA", l2 + 2, bottomY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setText(doc, COLORS.text);
  doc.text(money(totals.netHt), lvX + 2, bottomY + 13);
  doc.text(`${draft.vatRate} %`, l1 + 2, bottomY + 13);
  doc.text(money(totals.vatAmount), l2 + 2, bottomY + 13);
  setDraw(doc, COLORS.border);
  doc.line(lvX, bottomY + rowH, lvX + lvW, bottomY + rowH);
  doc.setFont("helvetica", "bold");
  setText(doc, COLORS.navy);
  doc.text("Total TVA", lvX + 2, bottomY + rowH + 6);
  doc.text(money(totals.vatAmount), lvX + lvW - 2, bottomY + rowH + 6, { align: "right" });

  setDraw(doc, COLORS.border);
  doc.roundedRect(rvX, bottomY, rvW, rowH, 2, 2);
  doc.line(rvX, bottomY + 8, rvX + rvW, bottomY + 8);

  const labels = ["Total HT", "Escompte", "Total TTC", "Acompte"];
  const values = [totals.totalHt, draft.discount, totals.totalTtc, draft.deposit];
  const netColW = Math.max(26, rvW * 0.22);
  const dataColW = (rvW - netColW) / 4;

  for (let i = 0; i < 4; i++) {
    const colX = rvX + i * dataColW;
    const cx = colX + dataColW / 2;
    if (i > 0) {
      setDraw(doc, COLORS.border);
      doc.line(colX, bottomY, colX, bottomY + rowH);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setText(doc, COLORS.slate);
    doc.text(labels[i], cx, bottomY + 5.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setText(doc, COLORS.text);
    doc.text(money(values[i]), cx, bottomY + 13, { align: "center" });
  }

  const netX = rvX + 4 * dataColW;
  setFill(doc, COLORS.navy);
  doc.rect(netX, bottomY, netColW, rowH, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  setText(doc, COLORS.gold);
  doc.text("NET À PAYER", netX + netColW / 2, bottomY + 5.5, { align: "center" });
  doc.setFontSize(8.5);
  setText(doc, COLORS.white);
  doc.text(money(totals.netToPay), netX + netColW / 2, bottomY + 14, { align: "center" });
}

function drawFooter(ctx: PdfCtx, template: DevisTemplate, y: number) {
  const { doc, right } = ctx;
  const centerX = (ctx.left + right) / 2;
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(ctx.left, y - 3, right, y - 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setText(doc, COLORS.slate);
  doc.text(template.sellerAddress, centerX, y, { align: "center" });
  doc.text(template.sellerLegal, centerX, y + 4, { align: "center" });
  doc.text(template.sellerContact, centerX, y + 8, { align: "center" });
}

export async function downloadDevisPdf(draft: QuoteDraft, template: DevisTemplate) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 12;
  const right = 198;
  const ctx: PdfCtx = { doc, left, right, pageW: 210 };

  const totalHt = draft.items.reduce(
    (acc, i) => (i.isNote ? acc : acc + i.qty * i.unitPrice),
    0,
  );
  const netHt = Math.max(0, totalHt - draft.discount);
  const vatAmount = (netHt * draft.vatRate) / 100;
  const totalTtc = netHt + vatAmount;
  const netToPay = Math.max(0, totalTtc - draft.deposit);
  const totals = { totalHt, netHt, vatAmount, totalTtc, netToPay };

  const logoDataUrl = await loadImageDataUrl(logoStacked.src);
  const headerBottom = drawHeader(ctx, template, draft, logoDataUrl);
  const titleBottom = drawTitleBlock(ctx, draft, headerBottom);
  const metaBottom = drawMetaRow(ctx, draft, titleBottom);

  const tableTop = metaBottom + 2;
  const tableBottom = 208;
  drawItemsTable(ctx, draft, tableTop, tableBottom);

  const bottomY = 214;
  drawTotals(ctx, draft, totals, bottomY);

  const signatureTop = 252;
  if (draft.includeCachet) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setText(doc, COLORS.slate);
    doc.text("Cachet et signature", right - 1, signatureTop, { align: "right" });
    const cachetDataUrl = await loadImageDataUrl(cachetSignature.src);
    if (cachetDataUrl) {
      try {
        doc.addImage(cachetDataUrl, "PNG", right - 58, signatureTop + 2, 56, 30);
      } catch {
        // skip
      }
    }
  }

  const footerY = draft.includeCachet ? 288 : 268;
  drawFooter(ctx, template, footerY);

  const documentType = draft.documentType ?? "devis";
  const fileSlug = documentType === "bon_commande" ? "bon-de-commande" : "devis";
  doc.save(`${fileSlug}-${draft.quoteNumber || "draft"}.pdf`);
}
