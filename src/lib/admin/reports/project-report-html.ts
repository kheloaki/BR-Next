import type { ProjectReportBundle, ProjectReportModule } from "@/lib/admin/project-report-types";
import { REPORT_MODULE_LABELS, REPORT_FOOTER_NOTE } from "@/lib/admin/reports/report-labels";
import {
  formatDateFr,
  formatLitres,
  formatMad,
  formatPercent,
  formatQty,
} from "@/lib/admin/reports/report-formatters";
import { buildProjectReportTables, type ReportTable } from "@/lib/admin/reports/project-report-tables";

function escHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableHtml(table: ReportTable): string {
  const th = table.headers.map((c) => `<th>${escHtml(c)}</th>`).join("");
  const body =
    table.rows.length > 0
      ? table.rows
          .map(
            (r) =>
              `<tr>${table.headers.map((_, i) => `<td>${escHtml(r[i] ?? "—")}</td>`).join("")}</tr>`,
          )
          .join("")
      : `<tr><td colspan="${table.headers.length}"><em>Aucune écriture sur la période.</em></td></tr>`;

  const title = table.title ? `<h2>${escHtml(table.title)}</h2>` : "";
  return `${title}<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
}

export function buildProjectReportHtml(module: ProjectReportModule, bundle: ProjectReportBundle): string {
  const p = bundle.meta.project;
  const title = REPORT_MODULE_LABELS[module];
  const kpis =
    module === "global"
      ? `
    <div class="kpis">
      <div class="kpi"><span>Litres gasoil</span><strong>${escHtml(formatLitres(bundle.gasoil.totals.litresSortie))}</strong></div>
      <div class="kpi"><span>Tonnage</span><strong>${escHtml(formatQty(bundle.production.totals.tonnage, "t"))}</strong></div>
      <div class="kpi"><span>Location HT</span><strong>${escHtml(formatMad(bundle.rentals.totals.ht))}</strong></div>
      <div class="kpi"><span>Marge</span><strong>${escHtml(formatMad(bundle.profitability.totals.margin))} (${escHtml(formatPercent(bundle.profitability.totals.marginPct))})</strong></div>
    </div>`
      : "";

  const tables = buildProjectReportTables(module, bundle)
    .filter((t) => !(module === "global" && t.title === "Synthèse indicateurs"))
    .map(tableHtml)
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <title>${escHtml(title)} — ${escHtml(p.name)}</title>
  <style>
    @page { margin: 15mm; }
    body { font-family: Helvetica, Arial, sans-serif; color: #1a2744; font-size: 11px; margin: 0; padding: 24px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    h2 { font-size: 13px; margin: 18px 0 8px; color: #1a2744; }
    .meta { color: #475569; margin-bottom: 16px; }
    .kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px; }
    .kpi { border: 1px solid #e2e8f0; padding: 8px 10px; border-radius: 4px; }
    .kpi span { display: block; color: #64748b; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px; table-layout: fixed; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; vertical-align: top; word-wrap: break-word; }
    th { background: #1a2744; color: #fff; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    footer { margin-top: 24px; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @media print {
      body { padding: 0; }
      h2 { page-break-after: avoid; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escHtml(title)}</h1>
  <p class="meta">
    <strong>${escHtml(p.name)}</strong>
    ${p.code ? ` · Code ${escHtml(p.code)}` : ""}
    ${p.clientName ? ` · ${escHtml(p.clientName)}` : ""}
    · ${escHtml(bundle.meta.periodLabel)}
    · Édité le ${escHtml(formatDateFr(bundle.meta.generatedAt.slice(0, 10)))}
  </p>
  ${kpis}
  ${tables}
  <footer>${escHtml(REPORT_FOOTER_NOTE)}</footer>
  <script>window.onload = () => { if (new URLSearchParams(location.search).get('print') === '1') window.print(); };</script>
</body>
</html>`;
}
