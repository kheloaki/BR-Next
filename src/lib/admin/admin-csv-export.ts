import { NextResponse } from "next/server";
import { adminExcelBytes, adminSectionsExcelBytes, type ExcelTextSection } from "@/lib/admin/admin-excel-export";
import { formatDateFr, formatDateTimeFr } from "@/lib/admin/date-time-fr";

export type CsvValueType = "text" | "number" | "currency" | "integer" | "date" | "datetime" | "percent";

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
  type?: CsvValueType;
  /** sum numeric column in totals row */
  total?: boolean;
  /** count rows in totals row */
  count?: boolean;
};

export type AdminCsvMeta = {
  title: string;
  subtitle?: string;
  organization?: string;
  generatedAt?: Date;
  period?: string;
  filters?: Array<{ label: string; value: string }>;
};

export type AdminExportFormat = "csv" | "excel";

const DEFAULT_DELIMITER = ";";
const META_RULE = "────────────────────────────────────────────────────────";

function escapeCell(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** French CSV cell — comma decimal, no thousands separator (Excel FR import). */
export function formatCsvCell(value: unknown, type: CsvValueType = "text"): string {
  if (value == null || value === "") return "";
  switch (type) {
    case "currency":
    case "number": {
      const n = Number(value) || 0;
      const decimals = type === "currency" ? 2 : Math.min(2, (String(n).split(".")[1] ?? "").length || 0);
      return n.toFixed(decimals).replace(".", ",");
    }
    case "integer":
      return String(Math.round(Number(value) || 0));
    case "percent": {
      const n = Number(value) || 0;
      return `${n.toFixed(1).replace(".", ",")} %`;
    }
    case "date":
      return formatDateFr(String(value));
    case "datetime":
      return formatDateTimeFr(String(value));
    default:
      return String(value);
  }
}

export function buildAdminCsv<T>(
  meta: AdminCsvMeta,
  columns: CsvColumn<T>[],
  rows: T[],
  options?: { delimiter?: string; includeTotals?: boolean; includeRowNumbers?: boolean },
): string {
  const delimiter = options?.delimiter ?? DEFAULT_DELIMITER;
  const includeRowNumbers = options?.includeRowNumbers !== false;
  const generatedAt = meta.generatedAt ?? new Date();
  const lines: string[] = [];

  lines.push(escapeCell(meta.title, delimiter));
  lines.push(escapeCell(META_RULE, delimiter));
  if (meta.organization) {
    lines.push(
      `${escapeCell("Organisation", delimiter)}${delimiter}${escapeCell(meta.organization, delimiter)}`,
    );
  }
  lines.push(
    `${escapeCell("Généré le", delimiter)}${delimiter}${escapeCell(formatDateTimeFr(generatedAt.toISOString()), delimiter)}`,
  );
  if (meta.period) {
    lines.push(`${escapeCell("Période", delimiter)}${delimiter}${escapeCell(meta.period, delimiter)}`);
  }
  if (meta.subtitle) {
    lines.push(`${escapeCell("Description", delimiter)}${delimiter}${escapeCell(meta.subtitle, delimiter)}`);
  }
  for (const filter of meta.filters ?? []) {
    lines.push(`${escapeCell(filter.label, delimiter)}${delimiter}${escapeCell(filter.value, delimiter)}`);
  }
  lines.push(`${escapeCell("Nombre de lignes", delimiter)}${delimiter}${String(rows.length)}`);
  lines.push("");

  const headers = [
    ...(includeRowNumbers ? ["N°"] : []),
    ...columns.map((c) => c.header),
  ];
  lines.push(headers.map((h) => escapeCell(h, delimiter)).join(delimiter));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const cells = [
      ...(includeRowNumbers ? [String(i + 1)] : []),
      ...columns.map((c) => formatCsvCell(c.value(row), c.type ?? "text")),
    ];
    lines.push(cells.map((v) => escapeCell(v, delimiter)).join(delimiter));
  }

  const showTotals = options?.includeTotals !== false && columns.some((c) => c.total || c.count);
  if (showTotals && rows.length > 0) {
    lines.push("");
    const totalCells = [
      ...(includeRowNumbers ? ["TOTAL"] : []),
      ...columns.map((c, index) => {
        if (c.count) return String(rows.length);
        if (c.total) {
          const sum = rows.reduce((acc, r) => acc + (Number(c.value(r)) || 0), 0);
          return formatCsvCell(sum, c.type ?? "number");
        }
        if (index === 0 && !includeRowNumbers) return "TOTAL";
        return "";
      }),
    ];
    lines.push(totalCells.map((v) => escapeCell(v, delimiter)).join(delimiter));
  }

  if (rows.length === 0) {
    lines.push("");
    lines.push(
      [
        ...(includeRowNumbers ? [""] : []),
        ...columns.map((_, i) => (i === 0 ? "Aucune donnée sur la période sélectionnée" : "")),
      ]
        .map((v) => escapeCell(v, delimiter))
        .join(delimiter),
    );
  }

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export type AdminTableSection = ExcelTextSection;

export function buildAdminSectionsCsv(meta: AdminCsvMeta, sections: AdminTableSection[]): string {
  const delimiter = DEFAULT_DELIMITER;
  const generatedAt = meta.generatedAt ?? new Date();
  const lines: string[] = [];

  lines.push(escapeCell(meta.title, delimiter));
  lines.push(escapeCell(META_RULE, delimiter));
  if (meta.organization) {
    lines.push(
      `${escapeCell("Organisation", delimiter)}${delimiter}${escapeCell(meta.organization, delimiter)}`,
    );
  }
  lines.push(
    `${escapeCell("Généré le", delimiter)}${delimiter}${escapeCell(formatDateTimeFr(generatedAt.toISOString()), delimiter)}`,
  );
  if (meta.period) {
    lines.push(`${escapeCell("Période", delimiter)}${delimiter}${escapeCell(meta.period, delimiter)}`);
  }
  if (meta.subtitle) {
    lines.push(`${escapeCell("Description", delimiter)}${delimiter}${escapeCell(meta.subtitle, delimiter)}`);
  }
  for (const filter of meta.filters ?? []) {
    lines.push(`${escapeCell(filter.label, delimiter)}${delimiter}${escapeCell(filter.value, delimiter)}`);
  }
  const rowCount = sections.reduce((acc, s) => acc + s.rows.length, 0);
  lines.push(`${escapeCell("Nombre de lignes", delimiter)}${delimiter}${String(rowCount)}`);
  lines.push("");

  for (const section of sections) {
    if (section.title) {
      lines.push(escapeCell(section.title, delimiter));
    }
    lines.push(section.headers.map((h) => escapeCell(h, delimiter)).join(delimiter));
    if (section.rows.length === 0) {
      lines.push(
        section.headers
          .map((_, i) => escapeCell(i === 0 ? "Aucune donnée sur la période sélectionnée" : "", delimiter))
          .join(delimiter),
      );
    } else {
      for (const row of section.rows) {
        lines.push(
          section.headers
            .map((_, i) => escapeCell(String(row[i] ?? ""), delimiter))
            .join(delimiter),
        );
      }
    }
    lines.push("");
  }

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function adminSectionsResponse(
  filename: string,
  meta: AdminCsvMeta,
  sections: AdminTableSection[],
  format: AdminExportFormat = "csv",
): NextResponse {
  if (format === "excel") {
    const bytes = adminSectionsExcelBytes(meta, sections);
    return adminExportResponse(bytes, filename, "excel");
  }
  const body = buildAdminSectionsCsv(meta, sections);
  return adminExportResponse(body, filename, "csv");
}

export function exportFilename(base: string, format: AdminExportFormat): string {
  const safe = base.replace(/\.(csv|xls|xlsx)$/i, "");
  const stamp = new Date().toISOString().slice(0, 10);
  return format === "excel" ? `${safe}-${stamp}.xls` : `${safe}-${stamp}.csv`;
}

export function adminExportResponse(
  body: string | Uint8Array,
  filename: string,
  format: AdminExportFormat = "csv",
): NextResponse {
  const isExcel = format === "excel";
  if (isExcel && body instanceof Uint8Array) {
    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename(filename, format)}"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new NextResponse(typeof body === "string" ? body : Buffer.from(body), {
    headers: {
      "Content-Type": isExcel
        ? "application/vnd.ms-excel; charset=utf-8"
        : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFilename(filename, format)}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function adminCsvResponse<T>(
  filename: string,
  meta: AdminCsvMeta,
  columns: CsvColumn<T>[],
  rows: T[],
  format: AdminExportFormat = "csv",
): NextResponse {
  if (format === "excel") {
    const bytes = adminExcelBytes(meta, columns, rows);
    return adminExportResponse(bytes, filename, "excel");
  }
  const body = buildAdminCsv(meta, columns, rows);
  return adminExportResponse(body, filename, "csv");
}

/** Backward-compatible helper for simple header + string[][] exports */
export function simpleCsvResponse(
  filename: string,
  headers: string[],
  rows: string[][],
  meta?: Partial<AdminCsvMeta> & { format?: AdminExportFormat },
): NextResponse {
  const { format = "csv", ...metaRest } = meta ?? {};
  const columns: CsvColumn<string[]>[] = headers.map((header, index) => ({
    header,
    value: (row) => row[index] ?? "",
  }));
  return adminCsvResponse(
    filename,
    {
      title: metaRest.title ?? filename.replace(/\.(csv|xls)$/i, ""),
      organization: "BARANE INVEST",
      ...metaRest,
    },
    columns,
    rows,
    format,
  );
}

export function parseExportFormat(value: string | null): AdminExportFormat {
  return value === "excel" || value === "xls" ? "excel" : "csv";
}

export function appendExportFormat(href: string, format: AdminExportFormat): string {
  const withoutFormat = href.replace(/([?&])format=(csv|excel|xls)(&|$)/, "$1").replace(/[?&]$/, "");
  const sep = withoutFormat.includes("?") ? "&" : "?";
  return `${withoutFormat}${sep}format=${format}`;
}

export function periodLabelFr(from?: string, to?: string): string | undefined {
  if (!from && !to) return undefined;
  if (from && to) return `Du ${formatDateFr(from)} au ${formatDateFr(to)}`;
  if (from) return `À partir du ${formatDateFr(from)}`;
  return `Jusqu'au ${formatDateFr(to!)}`;
}
