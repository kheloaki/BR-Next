import { jsPDF } from "jspdf";
import logoStacked from "@/assets/barane-logo-stacked.png";
import cachetSignature from "@/assets/barane-cachet-signature.png";
import {
  DOCUMENT_LABELS,
  isDeliveryNote,
  isSupplierDocument,
  type Customer,
  type DevisTemplate,
  type DocumentType,
  type QuoteDraft,
  type Supplier,
} from "@/components/admin/devis-types";
import { computeDocumentTotals } from "@/lib/admin/price-ht-ttc";
import { enrichQuoteCounterparty } from "@/lib/admin/quote-counterparty";

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

/** Collapse odd whitespace so PDF wrapping does not split words mid-character. */
function normalizeDesignationText(text: string) {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[\u2000-\u200B\u202F\u205F\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word-wrap at spaces; only break long tokens when unavoidable. */
function wrapDesignationLines(doc: jsPDF, text: string, maxWidth: number, fontSize = 7.5): string[] {
  doc.setFontSize(fontSize);
  const normalized = normalizeDesignationText(text);
  if (!normalized) return ["—"];

  const lines: string[] = [];
  const paragraphs = normalized.split(/\n+/);

  for (const paragraph of paragraphs) {
    const words = paragraph.split(" ").filter(Boolean);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (doc.getTextWidth(candidate) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (doc.getTextWidth(word) <= maxWidth) {
        current = word;
      } else {
        lines.push(...doc.splitTextToSize(word, maxWidth));
        current = "";
      }
    }
    if (current) lines.push(current);
  }

  return lines.length > 0 ? lines : ["—"];
}

type PdfCtx = {
  doc: jsPDF;
  left: number;
  right: number;
  pageW: number;
};

const PDF_PAGE_HEIGHT = 297;
const PDF_SINGLE_PAGE_MAX_ITEMS = 20;

type PdfLayout = {
  compact: boolean;
  pageHeight: number;
  rowMinH: number;
  rowPadY: number;
  lineHeight: number;
  rowGap: number;
  descFontSize: number;
  tableHeaderH: number;
  tableContentOffset: number;
  totalsBlockH: number;
  totalsRowH: number;
  tailGap: number;
  footerBlockH: number;
  reservedTail: number;
  tailItemsBottom: number;
  fullItemsBottom: number;
  continuationTop: number;
};

function createPdfLayout(draft: QuoteDraft, delivery: boolean): PdfLayout {
  const lineItemCount = draft.items.filter((item) => !item.isNote).length;
  const compact = !delivery && lineItemCount <= PDF_SINGLE_PAGE_MAX_ITEMS;
  const pageHeight = PDF_PAGE_HEIGHT;

  if (compact) {
    const totalsBlockH = 30;
    const tailGap = 3;
    const footerBlockH = 13;
    const reservedTail = totalsBlockH + tailGap + footerBlockH;
    return {
      compact: true,
      pageHeight,
      rowMinH: 6.2,
      rowPadY: 1,
      lineHeight: 3.3,
      rowGap: 0.25,
      descFontSize: 7,
      tableHeaderH: 7,
      tableContentOffset: 2,
      totalsBlockH,
      totalsRowH: 18,
      tailGap,
      footerBlockH,
      reservedTail,
      tailItemsBottom: pageHeight - reservedTail,
      fullItemsBottom: 277,
      continuationTop: 12,
    };
  }

  const totalsBlockH = 38;
  const tailGap = 6;
  const footerBlockH = 28;
  const reservedTail = totalsBlockH + tailGap + footerBlockH;
  return {
    compact: false,
    pageHeight,
    rowMinH: 9,
    rowPadY: 2.5,
    lineHeight: 3.9,
    rowGap: 1,
    descFontSize: 7.5,
    tableHeaderH: 9,
    tableContentOffset: 3,
    totalsBlockH,
    totalsRowH: 22,
    tailGap,
    footerBlockH,
    reservedTail,
    tailItemsBottom: pageHeight - reservedTail,
    fullItemsBottom: 277,
    continuationTop: 14,
  };
}

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
function drawCompanyBrand(
  ctx: PdfCtx,
  template: DevisTemplate,
  top: number,
  contentLeft: number,
  compact: boolean,
) {
  const { doc, right } = ctx;
  const areaLeft = contentLeft;
  const areaRight = right - 2;
  const areaCenterX = (areaLeft + areaRight) / 2;
  const panelY = top;
  const padX = compact ? 5 : 6;
  const padTop = compact ? 2 : 3;
  const padBottom = compact ? 1.5 : 2.5;
  const nameSize = compact ? 14 : 18;
  const activitySize = compact ? 8.5 : 10;
  const nameLineH = compact ? 5.5 : 6.5;
  const activityLineH = compact ? 3.6 : 4.2;
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
  compact: boolean,
) {
  const { doc } = ctx;
  const barW = 1.4;
  const padLeft = compact ? 4 : 5;
  const padRight = compact ? 4 : 5;
  const textX = boxX + barW + padLeft;
  const textMaxW = boxW - barW - padLeft - padRight;
  const nameFontSize = compact ? 9.5 : 11;
  const bodyFontSize = compact ? 8 : 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameFontSize);
  const nameLines = doc.splitTextToSize(draft.clientName || "—", textMaxW);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(bodyFontSize);
  const iceLine = `ICE : ${draft.clientIce || "—"}`;
  const addrLines = draft.clientAddress
    ? doc.splitTextToSize(draft.clientAddress, textMaxW)
    : [];

  const nameLineStep = compact ? 3.6 : 4;
  const addrLineStep = compact ? 3.4 : 3.8;
  const boxH =
    draft.clientAddress
      ? (compact ? 9 : 11) +
        nameLines.length * nameLineStep +
        3 +
        3.5 +
        addrLines.length * addrLineStep +
        (compact ? 3 : 5)
      : (compact ? 9 : 11) + nameLines.length * nameLineStep + 3 + (compact ? 3 : 5);

  setFill(doc, COLORS.goldLight);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2.5, 2.5, "F");
  setFill(doc, COLORS.gold);
  doc.rect(boxX, boxY, barW, boxH, "F");
  setDraw(doc, COLORS.gold);
  doc.setLineWidth(0.35);
  doc.roundedRect(boxX, boxY, boxW, boxH, 2.5, 2.5, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(compact ? 7 : 8);
  setText(doc, COLORS.gold);
  const docType = draft.documentType ?? "devis";
  const partyLabel = isPurchaseOrder(draft)
    ? "FOURNISSEUR"
    : docType === "facture"
      ? "FACTURÉ À"
      : docType === "bon_livraison"
        ? "LIVRÉ À"
        : "CLIENT";
  doc.text(partyLabel, textX, boxY + (compact ? 4.5 : 5.5));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameFontSize);
  setText(doc, COLORS.navy);
  doc.text(nameLines, textX, boxY + (compact ? 9.5 : 12));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(bodyFontSize);
  setText(doc, COLORS.slate);
  doc.text(iceLine, textX, boxY + (compact ? 9.5 : 12) + nameLines.length * (compact ? 3.8 : 4.2));

  if (draft.clientAddress) {
    const addrY = boxY + (compact ? 9.5 : 12) + nameLines.length * (compact ? 3.8 : 4.2) + 3;
    doc.text(addrLines, textX, addrY);
  }

  return boxH;
}

function drawHeader(
  ctx: PdfCtx,
  template: DevisTemplate,
  draft: QuoteDraft,
  logoDataUrl: string | null,
  compact: boolean,
) {
  const { doc, left, right } = ctx;
  const top = compact ? 5 : 8;
  const logoW = compact ? 16 : 22;
  const logoH = compact ? 20 : 28;
  const contentLeft = left + logoW + (compact ? 4 : 6);

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", left, top, logoW, logoH);
    } catch {
      // continue without logo
    }
  }

  const brandBottom = drawCompanyBrand(ctx, template, top, contentLeft, compact);
  const headerRowBottom = Math.max(top + logoH, brandBottom);
  drawHRule(ctx, headerRowBottom + (compact ? 1.5 : 2));

  const boxW = 108;
  const boxX = right - boxW;
  const boxY = headerRowBottom + (compact ? 3 : 6);
  const boxH = drawClientBox(ctx, draft, boxX, boxY, boxW, compact);

  return boxY + boxH + (compact ? 2 : 4);
}

function isPurchaseOrder(draft: QuoteDraft) {
  return draft.documentType === "bon_commande";
}

function pdfFileSlug(documentType: DocumentType) {
  if (documentType === "bon_commande") return "bon-de-commande";
  if (documentType === "facture") return "facture";
  if (documentType === "bon_livraison") return "bon-de-livraison";
  return "devis";
}

function drawTitleBlock(ctx: PdfCtx, draft: QuoteDraft, startY: number, compact: boolean) {
  const { doc, left } = ctx;
  const documentType = draft.documentType ?? "devis";
  const documentLabel = DOCUMENT_LABELS[documentType];
  const titleSuffix = draft.quoteNumber ? ` N° ${draft.quoteNumber}` : "";
  const y = startY + (compact ? 3 : 6);

  setFill(doc, COLORS.gold);
  doc.rect(left, y - (compact ? 1.5 : 2), 3, compact ? 8 : 10, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(compact ? 14 : 18);
  setText(doc, COLORS.navyDeep);
  doc.text(`${documentLabel}${titleSuffix}`, left + 6, y + (compact ? 4 : 5));
  return y + (compact ? 9 : 12);
}

function drawMetaRow(ctx: PdfCtx, draft: QuoteDraft, startY: number, compact: boolean) {
  const { doc, left } = ctx;
  const y = startY;
  const h = compact ? 10 : 14;
  const docType = draft.documentType ?? "devis";
  const isFacture = docType === "facture";
  const delivery = isDeliveryNote(docType);
  const cols = [
    { label: "Numéro", value: draft.quoteNumber || "—", w: 32 },
    { label: "Date", value: formatDateShort(draft.date), w: 32 },
    ...(isFacture && draft.dueDate
      ? [{ label: "Échéance", value: formatDateShort(draft.dueDate), w: 32 }]
      : []),
    ...(delivery && draft.linkedFactureNumber
      ? [{ label: "Facture", value: `N° ${draft.linkedFactureNumber}`, w: 36 }]
      : []),
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
    doc.text(col.label.toUpperCase(), x + col.w / 2, y + (compact ? 3.8 : 4.5), { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(compact ? 8 : 9);
    setText(doc, COLORS.navy);
    doc.text(col.value, x + col.w / 2, y + (compact ? 8 : 10.5), { align: "center" });
    x += col.w + 3;
  }
  return y + h + (compact ? 2 : 4);
}

function measureItemRowHeight(
  doc: jsPDF,
  item: QuoteDraft["items"][number],
  left: number,
  right: number,
  c1: number,
  layout: PdfLayout,
): number {
  const { lineHeight, rowPadY, descFontSize, rowMinH, rowGap } = layout;
  const descPadX = 2;

  if (item.isNote) {
    const wrapped = wrapDesignationLines(doc, item.designation || "", right - left - 10, descFontSize);
    return Math.max(rowMinH, wrapped.length * lineHeight + rowPadY * 2) + rowGap + 0.5;
  }

  const descWidth = c1 - left - descPadX * 2;
  const wrapped = wrapDesignationLines(doc, item.designation, descWidth, descFontSize);
  return Math.max(rowMinH, wrapped.length * lineHeight + rowPadY * 2) + rowGap;
}

function drawItemsTable(ctx: PdfCtx, draft: QuoteDraft, tableTop: number, layout: PdfLayout): number {
  const { doc, left, right } = ctx;
  const delivery = isDeliveryNote(draft.documentType ?? "devis");
  const c0 = left;
  const c1 = delivery ? c0 + 150 : c0 + 110;
  const c2 = delivery ? right : c1 + 18;
  const c3 = delivery ? c2 : c2 + 20;
  const c4 = delivery ? c3 : c3 + 12;
  const c5 = right;
  const {
    tableHeaderH: headerH,
    lineHeight,
    rowPadY,
    descFontSize,
    rowMinH,
    rowGap,
    tableContentOffset,
  } = layout;
  const descPadX = 2;
  const vertLines = delivery ? [c1] : [c1, c2, c3, c4];

  let segmentTop = tableTop;
  let y = 0;
  let rowIndex = 0;

  function remainingItemsHeight(fromIndex: number): number {
    let total = 0;
    for (let i = fromIndex; i < draft.items.length; i++) {
      total += measureItemRowHeight(doc, draft.items[i], left, right, c1, layout);
    }
    return total;
  }

  function effectiveSegmentBottom(fromIndex: number): number {
    const remaining = remainingItemsHeight(fromIndex);
    const fitsWithTotals = y + remaining + layout.reservedTail <= layout.pageHeight;
    return fitsWithTotals ? layout.tailItemsBottom : layout.fullItemsBottom;
  }

  function drawColumnHeader(atTop: number) {
    setFill(doc, COLORS.navy);
    doc.rect(left, atTop, right - left, headerH, "F");
    const headers = delivery
      ? [
          { x: (c0 + c1) / 2, t: "Désignation" },
          { x: (c1 + c2) / 2, t: "Qté livrée" },
        ]
      : [
          { x: (c0 + c1) / 2, t: "Désignation" },
          { x: (c1 + c2) / 2, t: "Qté" },
          { x: (c2 + c3) / 2, t: "P.U." },
          { x: (c3 + c4) / 2, t: "Rem." },
          { x: (c4 + c5) / 2, t: "Montant HT" },
        ];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setText(doc, COLORS.white);
    for (const h of headers) {
      doc.text(h.t, h.x, atTop + 6, { align: "center" });
    }
  }

  function drawSegmentFrame(atTop: number, contentBottomY: number) {
    const frameBottom = Math.max(contentBottomY + rowPadY, atTop + headerH + 6);
    setDraw(doc, COLORS.border);
    doc.setLineWidth(0.2);
    doc.rect(left, atTop + headerH, right - left, frameBottom - atTop - headerH);
    for (const x of vertLines) {
      setDraw(doc, COLORS.border);
      doc.line(x, atTop + headerH, x, frameBottom);
    }
  }

  function startSegment(top: number) {
    segmentTop = top;
    drawColumnHeader(top);
    y = top + headerH + rowPadY + tableContentOffset;
    rowIndex = 0;
  }

  function finalizeSegment(contentBottomY: number) {
    drawSegmentFrame(segmentTop, contentBottomY);
  }

  function startContinuationPage(contentBottomY: number) {
    finalizeSegment(contentBottomY);
    doc.addPage();
    startSegment(layout.continuationTop);
  }

  startSegment(tableTop);

  for (let itemIndex = 0; itemIndex < draft.items.length; itemIndex++) {
    const item = draft.items[itemIndex];
    const segmentBottom = effectiveSegmentBottom(itemIndex);

    if (item.isNote) {
      doc.setFont("helvetica", "bolditalic");
      const wrapped = wrapDesignationLines(doc, item.designation || "", right - left - 10, descFontSize);
      const noteHeight = Math.max(rowMinH, wrapped.length * lineHeight + rowPadY * 2);
      let noteTop = y - rowPadY;
      if (noteTop + noteHeight > segmentBottom) {
        startContinuationPage(y);
        noteTop = y - rowPadY;
      }

      setFill(doc, COLORS.goldLight);
      doc.rect(left + 0.5, noteTop, right - left - 1, noteHeight, "F");
      setFill(doc, COLORS.gold);
      doc.rect(left + 0.5, noteTop, 2, noteHeight, "F");
      setText(doc, COLORS.slate);
      doc.text(wrapped, left + 5, y);
      doc.setFont("helvetica", "normal");
      setText(doc, COLORS.text);
      y = noteTop + noteHeight + rowGap + 0.5;
      continue;
    }

    doc.setFont("helvetica", "normal");
    const descWidth = c1 - c0 - descPadX * 2;
    const wrapped = wrapDesignationLines(doc, item.designation, descWidth, descFontSize);
    const rowHeight = Math.max(rowMinH, wrapped.length * lineHeight + rowPadY * 2);
    let rowTop = y - rowPadY;
    if (rowTop + rowHeight > segmentBottom) {
      startContinuationPage(y);
      rowTop = y - rowPadY;
    }

    if (rowIndex % 2 === 1) {
      setFill(doc, COLORS.rowAlt);
      doc.rect(left + 0.5, rowTop, right - left - 1, rowHeight, "F");
    }
    rowIndex++;

    const qtyLabel = item.unit ? `${money(item.qty)} ${item.unit}` : money(item.qty);
    const numericY = rowTop + rowHeight / 2 + 1;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(descFontSize);
    setText(doc, COLORS.text);
    doc.text(wrapped, c0 + descPadX, y);

    doc.setFontSize(layout.compact ? 7.5 : 8);
    setText(doc, COLORS.text);
    doc.text(qtyLabel, (c1 + c2) / 2, numericY, { align: "center" });
    if (!delivery) {
      const amount = item.qty * item.unitPrice;
      doc.text(money(item.unitPrice), (c2 + c3) / 2, numericY, { align: "center" });
      doc.text(money(0), (c3 + c4) / 2, numericY, { align: "center" });
      doc.setFont("helvetica", "bold");
      setText(doc, COLORS.navy);
      doc.text(money(amount), (c4 + c5) / 2, numericY, { align: "center" });
      doc.setFont("helvetica", "normal");
    }

    y = rowTop + rowHeight + rowGap;
  }

  finalizeSegment(y);
  return y;
}

function drawTotals(
  ctx: PdfCtx,
  draft: QuoteDraft,
  totals: { totalHt: number; netHt: number; vatAmount: number; totalTtc: number; netToPay: number },
  bottomY: number,
  layout: PdfLayout,
) {
  const { doc, left, right } = ctx;

  const gap = layout.compact ? 10 : 12;
  const rowH = layout.totalsRowH;
  const leftExtra = layout.compact ? 10 : 14;
  const lvX = left;
  const lvW = 64;
  const rvX = lvX + lvW + gap;
  const rvW = right - rvX;

  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.25);
  doc.roundedRect(lvX, bottomY, lvW, rowH + leftExtra, 2, 2);
  doc.line(lvX, bottomY + 8, lvX + lvW, bottomY + 8);
  const l1 = lvX + 22;
  const l2 = lvX + 42;
  [l1, l2].forEach((x) => {
    setDraw(doc, COLORS.border);
    doc.line(x, bottomY, x, bottomY + rowH + leftExtra);
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

  const depositLabel = (draft.documentType ?? "devis") === "facture" ? "Acompte versé" : "Acompte";
  const labels = ["Total HT", "Escompte", "Total TTC", depositLabel];
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

function drawFooter(ctx: PdfCtx, template: DevisTemplate, y: number, compact: boolean) {
  const { doc, right } = ctx;
  const centerX = (ctx.left + right) / 2;
  const fontSize = compact ? 6.5 : 7.5;
  const lineGap = compact ? 3.2 : 4;
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(ctx.left, y - (compact ? 2 : 3), right, y - (compact ? 2 : 3));
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  setText(doc, COLORS.slate);
  doc.text(template.sellerAddress, centerX, y, { align: "center" });
  doc.text(template.sellerLegal, centerX, y + lineGap, { align: "center" });
  doc.text(template.sellerContact, centerX, y + lineGap * 2, { align: "center" });
}

export async function downloadDevisPdf(draft: QuoteDraft, template: DevisTemplate) {
  let resolved = draft;
  if (!draft.clientIce?.trim() && draft.clientName?.trim()) {
    try {
      const isPo = isSupplierDocument(draft.documentType ?? "devis");
      const res = await fetch(isPo ? "/api/admin/suppliers" : "/api/admin/customers", { cache: "no-store" });
      if (res.ok) {
        const list = (await res.json()) as Supplier[] | Customer[];
        resolved = enrichQuoteCounterparty(
          draft,
          isPo ? (list as Supplier[]) : [],
          isPo ? [] : (list as Customer[]),
        );
      }
    } catch {
      // keep original draft
    }
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 12;
  const right = 198;
  const ctx: PdfCtx = { doc, left, right, pageW: 210 };
  const documentType = resolved.documentType ?? "devis";
  const delivery = isDeliveryNote(documentType);

  const totals = computeDocumentTotals(
    resolved.items,
    resolved.vatRate,
    resolved.discount,
    resolved.deposit,
  );

  const layout = createPdfLayout(resolved, delivery);

  const logoDataUrl = await loadImageDataUrl(logoStacked.src);
  const headerBottom = drawHeader(ctx, template, resolved, logoDataUrl, layout.compact);
  const titleBottom = drawTitleBlock(ctx, resolved, headerBottom, layout.compact);
  const metaBottom = drawMetaRow(ctx, resolved, titleBottom, layout.compact);

  const tableTop = metaBottom + (layout.compact ? 1 : 2);
  const lastItemY = drawItemsTable(ctx, resolved, tableTop, layout);

  if (!delivery) {
    let totalsY = lastItemY + layout.tailGap;
    if (totalsY + layout.reservedTail > layout.pageHeight) {
      doc.addPage();
      totalsY = layout.continuationTop + 6;
    }
    drawTotals(ctx, resolved, totals, totalsY, layout);

    let belowTotals = totalsY + layout.totalsBlockH + (layout.compact ? 2 : 4);
    if (resolved.includeCachet) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(layout.compact ? 7 : 8);
      setText(doc, COLORS.slate);
      doc.text("Cachet et signature", right - 1, belowTotals + 4, { align: "right" });
      const cachetDataUrl = await loadImageDataUrl(cachetSignature.src);
      if (cachetDataUrl) {
        try {
          const cachetH = layout.compact ? 24 : 30;
          doc.addImage(cachetDataUrl, "PNG", right - 58, belowTotals + 6, 56, cachetH);
        } catch {
          // skip
        }
      }
      belowTotals += layout.compact ? 30 : 38;
    }

    const footerY = layout.compact
      ? belowTotals + 2
      : Math.min(layout.pageHeight - 8, Math.max(belowTotals + 6, 268));
    drawFooter(ctx, template, footerY, layout.compact);
  } else {
    const { doc, left, right } = ctx;
    const noteY = Math.min(lastItemY + 6, 270);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    setText(doc, COLORS.slate);
    doc.text(
      "Bon de livraison — quantités livrées. Montants sur la facture référencée.",
      (left + right) / 2,
      noteY,
      { align: "center" },
    );
    const footerY = Math.min(272, Math.max(noteY + 10, 268));
    drawFooter(ctx, template, footerY, layout.compact);
  }

  const fileSlug = pdfFileSlug(documentType);
  doc.save(`${fileSlug}-${draft.quoteNumber || "draft"}.pdf`);
}
