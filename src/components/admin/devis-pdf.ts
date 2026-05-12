import { jsPDF } from "jspdf";
import logoHeader from "@/assets/barane-logo-horizontal-transparent.png";
import cachetSignature from "@/assets/barane-cachet-signature.png";
import {
  DOCUMENT_LABELS,
  type DevisTemplate,
  type QuoteDraft,
} from "@/components/admin/devis-types";

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

export async function downloadDevisPdf(draft: QuoteDraft, template: DevisTemplate) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 10;
  const right = 200;
  const thin = 0.25;
  const medium = 0.4;
  const totalHt = draft.items.reduce(
    (acc, i) => (i.isNote ? acc : acc + i.qty * i.unitPrice),
    0,
  );
  const netHt = Math.max(0, totalHt - draft.discount);
  const vatAmount = (netHt * draft.vatRate) / 100;
  const totalTtc = netHt + vatAmount;
  const netToPay = Math.max(0, totalTtc - draft.deposit);
  doc.setLineWidth(thin);

  const logoDataUrl = await loadImageDataUrl(logoHeader.src);
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", left, 6, 38, 14);
    } catch {
      // If image fails to embed, continue without logo
    }
  }

  doc.setFont("times", "bolditalic");
  doc.setFontSize(15);
  doc.text(template.sellerName, 105, 13, { align: "center" });
  doc.setLineWidth(medium);
  doc.line(18, 22, 192, 22);
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text(template.sellerActivity, 105, 27, { align: "center" });

  doc.setLineWidth(thin);
  doc.roundedRect(106, 39, 94, 28, 2, 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(draft.clientName, 153, 47, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`ICE: ${draft.clientIce || "-"}`, 153, 53, { align: "center" });
  if (draft.clientAddress) {
    doc.setFontSize(9);
    const addrLines = doc.splitTextToSize(draft.clientAddress, 88);
    doc.text(addrLines, 153, 59, { align: "center" });
    doc.setFontSize(10);
  }

  const documentType = draft.documentType ?? "devis";
  const documentLabel = DOCUMENT_LABELS[documentType];
  const titleSuffix = draft.quoteNumber ? ` N° ${draft.quoteNumber}` : "";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${documentLabel}${titleSuffix}`, left, 76);

  const hdrY = 84;
  doc.setLineWidth(medium);
  doc.rect(left, hdrY, 24, 8);
  doc.rect(left + 24, hdrY, 24, 8);
  doc.rect(left + 48, hdrY, 62, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("NUMERO", left + 12, hdrY + 5, { align: "center" });
  doc.text("DATE", left + 36, hdrY + 5, { align: "center" });
  doc.text("REFERENCE", left + 79, hdrY + 5, { align: "center" });
  doc.rect(left, hdrY + 8, 24, 8);
  doc.rect(left + 24, hdrY + 8, 24, 8);
  doc.rect(left + 48, hdrY + 8, 62, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(draft.quoteNumber || "-", left + 12, hdrY + 13, { align: "center" });
  doc.text(formatDateShort(draft.date), left + 36, hdrY + 13, { align: "center" });
  doc.text(draft.reference || "-", left + 79, hdrY + 13, { align: "center" });

  const tableY = 102;
  const rowBottom = 214;
  const c0 = left;
  const c1 = c0 + 24;
  const c2 = c1 + 86;
  const c3 = c2 + 18;
  const c4 = c3 + 22;
  const c5 = c4 + 14;
  const c6 = right;

  doc.setLineWidth(medium);
  doc.rect(left, tableY, right - left, 8);
  [c1, c2, c3, c4, c5].forEach((x) => doc.line(x, tableY, x, tableY + 8));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Référence", (c0 + c1) / 2, tableY + 5, { align: "center" });
  doc.text("Désignation", (c1 + c2) / 2, tableY + 5, { align: "center" });
  doc.text("Qté", (c2 + c3) / 2, tableY + 5, { align: "center" });
  doc.text("Px unitaire", (c3 + c4) / 2, tableY + 5, { align: "center" });
  doc.text("Remise", (c4 + c5) / 2, tableY + 5, { align: "center" });
  doc.text("Montant HT", (c5 + c6) / 2, tableY + 5, { align: "center" });

  doc.rect(left, tableY + 8, right - left, rowBottom - (tableY + 8));
  [c1, c2, c3, c4, c5].forEach((x) => doc.line(x, tableY + 8, x, rowBottom));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  let y = tableY + 14;
  for (const item of draft.items) {
    if (y > rowBottom - 4) break;
    const descY = Math.min(y, rowBottom - 4);
    if (item.isNote) {
      const noteText = item.designation || "";
      const wrapped = doc.splitTextToSize(noteText, right - left - 6);
      const noteHeight = Math.max(7, wrapped.length * 4.3 + 2);
      const noteTop = descY - 4;
      doc.setFillColor(252, 245, 235);
      doc.rect(left + 0.4, noteTop, right - left - 0.8, noteHeight, "F");
      doc.setFillColor(222, 122, 58);
      doc.rect(left + 0.4, noteTop, 1.5, noteHeight, "F");
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "bolditalic");
      doc.text(wrapped, left + 3.5, descY);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      y += noteHeight;
      continue;
    }
    const amount = item.qty * item.unitPrice;
    const wrapped = doc.splitTextToSize(item.designation, c2 - c1 - 2.5);
    doc.text(item.reference || "-", c0 + 1.5, descY);
    doc.text(wrapped, c1 + 1.5, descY);
    doc.text(money(item.qty), c2 + 1.5, descY);
    doc.text(money(item.unitPrice), c3 + 1.5, descY);
    doc.text(money(0), c4 + 1.5, descY);
    doc.text(money(amount), c5 + 1.5, descY);
    y += Math.max(8, wrapped.length * 4.3);
  }

  const bottomY = 218;
  const lvX = left;
  const lvW = 69;
  doc.rect(lvX, bottomY, lvW, 36);
  doc.line(lvX, bottomY + 8, lvX + lvW, bottomY + 8);
  const l1 = lvX + 24;
  const l2 = lvX + 42;
  [l1, l2].forEach((x) => doc.line(x, bottomY, x, bottomY + 36));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Base", lvX + 1.5, bottomY + 5);
  doc.text("Taux", l1 + 1.5, bottomY + 5);
  doc.text("Montant TVA", l2 + 1.5, bottomY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(money(netHt), lvX + 1.5, bottomY + 14);
  doc.text(`${draft.vatRate}%`, l1 + 1.5, bottomY + 14);
  doc.text(money(vatAmount), l2 + 1.5, bottomY + 14);
  doc.line(lvX, bottomY + 28, lvX + lvW, bottomY + 28);
  doc.setFont("helvetica", "bold");
  doc.text("Total", lvX + 1.5, bottomY + 33);
  doc.text(money(netHt), l1 - 1.5, bottomY + 33, { align: "right" });
  doc.text(money(vatAmount), lvX + lvW - 1.5, bottomY + 33, { align: "right" });

  const rvX = 80;
  const rvW = right - rvX;
  doc.rect(rvX, bottomY, rvW, 18);
  doc.line(rvX, bottomY + 8, rvX + rvW, bottomY + 8);
  const rw = [23, 23, 23, 23, 29];
  const rPos = [rvX];
  rw.forEach((w) => rPos.push(rPos[rPos.length - 1] + w));
  rPos.slice(1, -1).forEach((x) => doc.line(x, bottomY, x, bottomY + 18));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Total HT", (rPos[0] + rPos[1]) / 2, bottomY + 5, { align: "center" });
  doc.text("Escompte", (rPos[1] + rPos[2]) / 2, bottomY + 5, { align: "center" });
  doc.text("Total TTC", (rPos[2] + rPos[3]) / 2, bottomY + 5, { align: "center" });
  doc.text("Acompte", (rPos[3] + rPos[4]) / 2, bottomY + 5, { align: "center" });
  doc.text("NET A PAYER", (rPos[4] + rPos[5]) / 2, bottomY + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(money(totalHt), (rPos[0] + rPos[1]) / 2, bottomY + 14, { align: "center" });
  doc.text(money(draft.discount), (rPos[1] + rPos[2]) / 2, bottomY + 14, { align: "center" });
  doc.text(money(totalTtc), (rPos[2] + rPos[3]) / 2, bottomY + 14, { align: "center" });
  doc.text(money(draft.deposit), (rPos[3] + rPos[4]) / 2, bottomY + 14, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(money(netToPay), (rPos[4] + rPos[5]) / 2, bottomY + 14, { align: "center" });

  const signatureTop = 258;
  if (draft.includeCachet) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Cachet et signature", right - 1.5, signatureTop, { align: "right" });
    const cachetDataUrl = await loadImageDataUrl(cachetSignature.src);
    if (cachetDataUrl) {
      try {
        doc.addImage(cachetDataUrl, "PNG", right - 56, signatureTop + 1, 55, 32);
      } catch {
        // If image fails to embed, skip silently
      }
    }
  }

  const footerStart = draft.includeCachet ? 282 : 262;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(template.sellerAddress, 105, footerStart, { align: "center" });
  doc.text(template.sellerLegal, 105, footerStart + 5, { align: "center" });
  doc.text(template.sellerContact, 105, footerStart + 10, { align: "center" });
  const fileSlug = documentType === "bon_commande" ? "bon-de-commande" : "devis";
  doc.save(`${fileSlug}-${draft.quoteNumber || "draft"}.pdf`);
}
