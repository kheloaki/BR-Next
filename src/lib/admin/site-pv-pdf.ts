import { jsPDF } from "jspdf";
import type { SitePv } from "@/lib/admin/site-pv-types";
import { SITE_PV_STATUS_LABELS, SITE_PV_TYPE_LABELS } from "@/lib/admin/site-pv-types";
import { getDefaultOrganizationName } from "@/lib/admin/organization";

function formatDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function sitePvPdfBytes(pv: SitePv, projectName?: string, orgName?: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(orgName || getDefaultOrganizationName(), margin, y);
  y += 6;
  doc.setFontSize(11);
  doc.text(SITE_PV_TYPE_LABELS[pv.pvType].toUpperCase(), margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`N° ${pv.number} · ${formatDate(pv.pvDate)} · ${SITE_PV_STATUS_LABELS[pv.status]}`, margin, y);
  y += 8;

  const meta: [string, string][] = [
    ["Chantier", projectName || "—"],
    ["Objet", pv.object || "—"],
    ["Responsable", pv.responsiblePerson || "—"],
    ["Échéance", pv.deadline ? formatDate(pv.deadline) : "—"],
  ];
  meta.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label} :`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(value, pageW - margin * 2 - 28), margin + 28, y);
    y += Math.max(5, doc.splitTextToSize(value, pageW - margin * 2 - 28).length * 4.5);
  });
  y += 4;

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

  section("Observations", pv.observations);
  section("Décisions", pv.decisions);
  section("Réserves", pv.reserves);

  if (pv.participants.length > 0) {
    section(
      "Participants",
      pv.participants.map((p) => [p.name, p.role, p.company].filter(Boolean).join(" — ")).join("\n"),
    );
  }

  if (pv.actions.length > 0) {
    section(
      "Actions à mener",
      pv.actions
        .map((a) => `${a.task} (${a.responsible}${a.deadline ? ` · ${formatDate(a.deadline)}` : ""})`)
        .join("\n"),
    );
  }

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Signatures :", margin, y);
  y += 8;
  const sigW = (pageW - margin * 2 - 8) / 2;
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = margin + col * (sigW + 8);
    const sy = y + row * 22;
    doc.rect(x, sy, sigW, 18);
    doc.text(["Établi par", "Validé par", "Maître d'ouvrage", "Entrepreneur"][i] ?? "", x + 2, sy + 4);
  }

  return doc.output("arraybuffer");
}

export function sitePvPdfFilename(number: string) {
  return `${number.replace(/\//g, "-")}.pdf`;
}
