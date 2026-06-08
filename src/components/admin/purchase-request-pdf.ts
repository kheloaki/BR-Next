import { jsPDF } from "jspdf";
import logoStacked from "@/assets/barane-logo-stacked.png";
import type { PurchaseRequest } from "@/components/admin/operations-types";
import { PURCHASE_CATEGORY_LABELS, PURCHASE_STATUS_LABELS } from "@/components/admin/operations-types";
import { DEFAULT_VAT_RATE } from "@/lib/admin/price-ht-ttc";

const COLORS = {
  navy: [26, 39, 68] as [number, number, number],
  gold: [222, 122, 58] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  headerBg: [241, 245, 249] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
};

function money(value: number) {
  return new Intl.NumberFormat("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || "—";
  return d.toLocaleDateString("fr-FR");
}

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

export async function downloadPurchaseRequestPdf(
  da: PurchaseRequest,
  projectName?: string,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  const logo = await loadImageDataUrl(logoStacked.src);
  if (logo) doc.addImage(logo, "PNG", margin, y, 28, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.navy);
  doc.text("DEMANDE D'ACHAT", pageW - margin, y + 8, { align: "right" });
  doc.setFontSize(11);
  doc.text(`N° ${da.number}`, pageW - margin, y + 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.text(`Date : ${formatDate(da.createdAt)}`, pageW - margin, y + 21, { align: "right" });
  doc.text(`Statut : ${PURCHASE_STATUS_LABELS[da.status]}`, pageW - margin, y + 26, { align: "right" });

  y += 36;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const meta: [string, string][] = [
    ["Objet", da.subject],
    ["Catégorie", PURCHASE_CATEGORY_LABELS[da.category]],
    ["Chantier / projet", projectName || "—"],
    ["Demandeur", da.requester || "—"],
    ["Fournisseur suggéré", da.supplier || "—"],
    ["Urgence", da.urgency || "—"],
    ["Date livraison souhaitée", da.deliveryDate ? formatDate(da.deliveryDate) : "—"],
  ];

  if (da.approvedAt) {
    meta.push(["Approuvée le", formatDate(da.approvedAt)]);
  }

  doc.setFontSize(9);
  for (const [label, value] of meta) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, margin, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "—", pageW - margin * 2 - 42);
    doc.text(lines, margin + 42, y);
    y += Math.max(5, lines.length * 4.5);
  }

  y += 4;
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(margin, y, pageW - margin * 2, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Réf.", margin + 2, y + 4.5);
  doc.text("Désignation", margin + 22, y + 4.5);
  doc.text("Qté", pageW - margin - 48, y + 4.5, { align: "right" });
  doc.text("P.U. HT", pageW - margin - 32, y + 4.5, { align: "right" });
  doc.text("Total HT", pageW - margin - 2, y + 4.5, { align: "right" });
  y += 9;

  const designation = da.designation.trim() || da.subject;
  const totalHt = da.qty * da.unitPrice;
  doc.setFont("helvetica", "normal");
  doc.text(da.reference || "—", margin + 2, y + 4);
  doc.text(doc.splitTextToSize(designation, 70), margin + 22, y + 4);
  doc.text(String(da.qty), pageW - margin - 48, y + 4, { align: "right" });
  doc.text(money(da.unitPrice), pageW - margin - 32, y + 4, { align: "right" });
  doc.text(money(totalHt), pageW - margin - 2, y + 4, { align: "right" });
  y += 14;

  const ttc = totalHt * (1 + DEFAULT_VAT_RATE / 100);
  doc.setFont("helvetica", "bold");
  doc.text(`Total HT : ${money(totalHt)} MAD`, pageW - margin, y, { align: "right" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`Total TTC (${DEFAULT_VAT_RATE}%) : ${money(ttc)} MAD`, pageW - margin, y, { align: "right" });

  if (da.justification.trim()) {
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Justification", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(da.justification.trim(), pageW - margin * 2), margin, y);
  }

  doc.save(`${da.number.replace(/\//g, "-")}.pdf`);
}
