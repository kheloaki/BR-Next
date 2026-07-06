import type { AdminCsvMeta, CsvColumn, CsvValueType } from "@/lib/admin/admin-csv-export";
import { formatDateFr, formatDateTimeFr } from "@/lib/admin/date-time-fr";

function xmlEsc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseIsoDate(value: unknown): string | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const hasTime = /[T ]\d{2}:\d{2}/.test(raw);
  const time = hasTime ? raw.match(/[T ](\d{2}):(\d{2})/) : null;
  const hh = time?.[1] ?? "00";
  const mm = time?.[2] ?? "00";
  return `${m[1]}-${m[2]}-${m[3]}T${hh}:${mm}:00.000`;
}

function styleForType(type: CsvValueType = "text"): string {
  switch (type) {
    case "currency":
      return "Currency";
    case "number":
      return "Number";
    case "integer":
      return "Integer";
    case "date":
      return "Date";
    case "datetime":
      return "DateTime";
    case "percent":
      return "Percent";
    default:
      return "Data";
  }
}

function cellXml(
  value: unknown,
  type: CsvValueType = "text",
  styleId?: string,
  index?: number,
): string {
  const style = styleId ?? styleForType(type);
  const indexAttr = index != null ? ` ss:Index="${index}"` : "";

  if (value == null || value === "") {
    return `<Cell${indexAttr} ss:StyleID="${style}"><Data ss:Type="String"></Data></Cell>`;
  }

  if (type === "currency" || type === "number" || type === "integer" || type === "percent") {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return `<Cell${indexAttr} ss:StyleID="Data"><Data ss:Type="String">${xmlEsc(String(value))}</Data></Cell>`;
    }
    const excelValue = type === "percent" ? n / 100 : n;
    return `<Cell${indexAttr} ss:StyleID="${style}"><Data ss:Type="Number">${excelValue}</Data></Cell>`;
  }

  if (type === "date" || type === "datetime") {
    const iso = parseIsoDate(value);
    if (iso) {
      return `<Cell${indexAttr} ss:StyleID="${style}"><Data ss:Type="DateTime">${iso}</Data></Cell>`;
    }
    const display = type === "datetime" ? formatDateTimeFr(String(value)) : formatDateFr(String(value));
    return `<Cell${indexAttr} ss:StyleID="Data"><Data ss:Type="String">${xmlEsc(display)}</Data></Cell>`;
  }

  return `<Cell${indexAttr} ss:StyleID="${style}"><Data ss:Type="String">${xmlEsc(String(value))}</Data></Cell>`;
}

function rowXml(cells: string): string {
  return `<Row>${cells}</Row>`;
}

function mergeTitleRow(title: string, colCount: number): string {
  const span = Math.max(0, colCount - 1);
  return `<Row><Cell ss:MergeAcross="${span}" ss:StyleID="Title"><Data ss:Type="String">${xmlEsc(title)}</Data></Cell></Row>`;
}

function metaRow(label: string, value: string): string {
  return rowXml(
    `${cellXml(label, "text", "MetaLabel")}${cellXml(value, "text", "MetaValue", 2)}`,
  );
}

function columnWidth(header: string, type: CsvValueType): number {
  const base = Math.max(10, Math.min(42, header.length + 4));
  if (type === "currency") return Math.max(base, 16);
  if (type === "date" || type === "datetime") return Math.max(base, 14);
  return base;
}

const EXCEL_STYLES = ` <Styles>
  <Style ss:ID="Default"><Alignment ss:Vertical="Center"/></Style>
  <Style ss:ID="Title">
   <Font ss:Bold="1" ss:Size="14" ss:Color="#0B1F3A"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="MetaLabel">
   <Font ss:Bold="1" ss:Size="10" ss:Color="#4B5563"/>
  </Style>
  <Style ss:ID="MetaValue">
   <Font ss:Size="10" ss:Color="#111827"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Size="10" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0B1F3A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B1F3A"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B1F3A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B1F3A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0B1F3A"/>
   </Borders>
  </Style>
  <Style ss:ID="Data">
   <Font ss:Size="10"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <Style ss:ID="DataAlt" ss:Parent="Data">
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Index">
   <Font ss:Size="10" ss:Color="#6B7280"/>
   <Alignment ss:Horizontal="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/>
   </Borders>
  </Style>
  <Style ss:ID="Currency" ss:Parent="Data">
   <NumberFormat ss:Format="# ##0,00\ &quot;MAD&quot;"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="CurrencyAlt" ss:Parent="Currency">
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Number" ss:Parent="Data">
   <NumberFormat ss:Format="# ##0,00"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="NumberAlt" ss:Parent="Number">
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Integer" ss:Parent="Data">
   <NumberFormat ss:Format="# ##0"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="IntegerAlt" ss:Parent="Integer">
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Percent" ss:Parent="Data">
   <NumberFormat ss:Format="0,0\%"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="PercentAlt" ss:Parent="Percent">
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Date" ss:Parent="Data">
   <NumberFormat ss:Format="dd/mm/yyyy"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="DateAlt" ss:Parent="Date">
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DateTime" ss:Parent="Data">
   <NumberFormat ss:Format="dd/mm/yyyy\ hh:mm"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="DateTimeAlt" ss:Parent="DateTime">
   <Interior ss:Color="#F9FAFB" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Total">
   <Font ss:Bold="1" ss:Size="10" ss:Color="#0B1F3A"/>
   <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0B1F3A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0B1F3A"/>
   </Borders>
  </Style>
  <Style ss:ID="TotalCurrency" ss:Parent="Total">
   <NumberFormat ss:Format="# ##0,00\ &quot;MAD&quot;"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="TotalNumber" ss:Parent="Total">
   <NumberFormat ss:Format="# ##0,00"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="TotalInteger" ss:Parent="Total">
   <NumberFormat ss:Format="# ##0"/>
   <Alignment ss:Horizontal="Right"/>
  </Style>
  <Style ss:ID="SectionTitle">
   <Font ss:Bold="1" ss:Size="11" ss:Color="#0B1F3A"/>
   <Interior ss:Color="#E8EEF4" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>`;

export type ExcelTextSection = {
  title?: string;
  headers: string[];
  rows: string[][];
};

export function buildAdminExcelXml<T>(
  meta: AdminCsvMeta,
  columns: CsvColumn<T>[],
  rows: T[],
  options?: { includeTotals?: boolean; sheetName?: string },
): string {
  const generatedAt = meta.generatedAt ?? new Date();
  const colCount = columns.length + 1;
  const sheetName = (options?.sheetName ?? meta.title.replace(/^BARANE INVEST — /, "").slice(0, 31))
    .replace(/[\\/*?:[\]]/g, " ")
    .trim() || "Export";

  const metaRows: string[] = [
    mergeTitleRow(meta.title, colCount),
    rowXml(""),
    ...(meta.organization ? [metaRow("Organisation", meta.organization)] : []),
    metaRow("Généré le", formatDateTimeFr(generatedAt.toISOString())),
    ...(meta.period ? [metaRow("Période", meta.period)] : []),
    ...(meta.subtitle ? [metaRow("Description", meta.subtitle)] : []),
    ...(meta.filters ?? []).map((f) => metaRow(f.label, f.value)),
    metaRow("Nombre de lignes", String(rows.length)),
    rowXml(""),
  ];

  const headerCells = [
    cellXml("N°", "text", "Header"),
    ...columns.map((c, i) => cellXml(c.header, "text", "Header", i + 2)),
  ].join("");
  const headerRow = rowXml(headerCells);

  const dataRows = rows.map((row, rowIndex) => {
    const alt = rowIndex % 2 === 1;
    const textStyle = alt ? "DataAlt" : "Data";
    const cells = [
      cellXml(rowIndex + 1, "integer", "Index"),
      ...columns.map((c, i) => {
        const type = c.type ?? "text";
        let dataStyle = textStyle;
        if (type === "currency") dataStyle = alt ? "CurrencyAlt" : "Currency";
        else if (type === "number") dataStyle = alt ? "NumberAlt" : "Number";
        else if (type === "integer") dataStyle = alt ? "IntegerAlt" : "Integer";
        else if (type === "percent") dataStyle = alt ? "PercentAlt" : "Percent";
        else if (type === "date") dataStyle = alt ? "DateAlt" : "Date";
        else if (type === "datetime") dataStyle = alt ? "DateTimeAlt" : "DateTime";
        return cellXml(c.value(row), type, dataStyle, i + 2);
      }),
    ].join("");
    return rowXml(cells);
  });

  const showTotals =
    options?.includeTotals !== false && columns.some((c) => c.total || c.count) && rows.length > 0;
  const totalRows: string[] = [];
  if (showTotals) {
    totalRows.push(rowXml(""));
    const totalCells = [
      cellXml("TOTAL", "text", "Total"),
      ...columns.map((c, i) => {
        if (c.count) {
          return cellXml(rows.length, "integer", "TotalInteger", i + 2);
        }
        if (c.total) {
          const sum = rows.reduce((acc, row) => acc + (Number(c.value(row)) || 0), 0);
          const style =
            c.type === "currency"
              ? "TotalCurrency"
              : c.type === "integer"
                ? "TotalInteger"
                : "TotalNumber";
          return cellXml(sum, c.type ?? "number", style, i + 2);
        }
        return cellXml("", "text", "Total", i + 2);
      }),
    ].join("");
    totalRows.push(rowXml(totalCells));
  }

  const headerRowIndex = metaRows.length + 1;
  const lastDataRow = headerRowIndex + Math.max(rows.length, 1);
  const colLetters = colCount;

  const columnDefs = [
    `<Column ss:Width="36"/>`,
    ...columns.map((c) => `<Column ss:Width="${columnWidth(c.header, c.type ?? "text") * 6}"/>`),
  ].join("\n   ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${EXCEL_STYLES}
 <Worksheet ss:Name="${xmlEsc(sheetName)}">
  <Table>
   ${columnDefs}
   ${metaRows.join("\n   ")}
   ${headerRow}
   ${dataRows.join("\n   ")}
   ${totalRows.join("\n   ")}
  </Table>
  <AutoFilter x:Range="R${headerRowIndex}C1:R${lastDataRow}C${colLetters}" xmlns:x="urn:schemas-microsoft-com:office:excel"/>
  <FreezePanes/>
  <FrozenNoSplit/>
  <SplitHorizontal>${headerRowIndex}</SplitHorizontal>
  <TopRowBottomPane>${headerRowIndex}</TopRowBottomPane>
  <ActivePane>2</ActivePane>
 </Worksheet>
</Workbook>`;
}

export function adminExcelBytes<T>(
  meta: AdminCsvMeta,
  columns: CsvColumn<T>[],
  rows: T[],
  options?: { includeTotals?: boolean; sheetName?: string },
): Uint8Array {
  const xml = buildAdminExcelXml(meta, columns, rows, options);
  return new TextEncoder().encode("\uFEFF" + xml);
}

function sectionTitleRow(title: string, colCount: number): string {
  return rowXml(
    `<Cell ss:MergeAcross="${Math.max(0, colCount - 1)}" ss:StyleID="SectionTitle"><Data ss:Type="String">${xmlEsc(title)}</Data></Cell>`,
  );
}

function textSectionRows(section: ExcelTextSection): string[] {
  const colCount = Math.max(section.headers.length, 1);
  const out: string[] = [];
  if (section.title) out.push(sectionTitleRow(section.title, colCount));
  const headerCells = section.headers
    .map((h, i) => cellXml(h, "text", "Header", i + 1))
    .join("");
  out.push(rowXml(headerCells));
  for (let rowIndex = 0; rowIndex < section.rows.length; rowIndex++) {
    const alt = rowIndex % 2 === 1;
    const style = alt ? "DataAlt" : "Data";
    const cells = section.headers
      .map((_, i) => cellXml(section.rows[rowIndex]?.[i] ?? "", "text", style, i + 1))
      .join("");
    out.push(rowXml(cells));
  }
  if (section.rows.length === 0) {
    out.push(
      rowXml(
        `<Cell ss:StyleID="Data"><Data ss:Type="String">Aucune donnée sur la période sélectionnée</Data></Cell>`,
      ),
    );
  }
  out.push(rowXml(""));
  return out;
}

export function buildAdminSectionsExcelXml(
  meta: AdminCsvMeta,
  sections: ExcelTextSection[],
  options?: { sheetName?: string },
): string {
  const generatedAt = meta.generatedAt ?? new Date();
  const maxCols = Math.max(2, ...sections.map((s) => s.headers.length));
  const sheetName = (options?.sheetName ?? meta.title.replace(/^BARANE INVEST — /, "").slice(0, 31))
    .replace(/[\\/*?:[\]]/g, " ")
    .trim() || "Export";

  const metaRows: string[] = [
    mergeTitleRow(meta.title, maxCols),
    rowXml(""),
    ...(meta.organization ? [metaRow("Organisation", meta.organization)] : []),
    metaRow("Généré le", formatDateTimeFr(generatedAt.toISOString())),
    ...(meta.period ? [metaRow("Période", meta.period)] : []),
    ...(meta.subtitle ? [metaRow("Description", meta.subtitle)] : []),
    ...(meta.filters ?? []).map((f) => metaRow(f.label, f.value)),
    metaRow(
      "Nombre de lignes",
      String(sections.reduce((acc, s) => acc + s.rows.length, 0)),
    ),
    rowXml(""),
  ];

  const sectionBlocks = sections.flatMap((s) => textSectionRows(s));
  const headerRowIndex = metaRows.length + 1;

  const columnDefs = Array.from({ length: maxCols }, (_, i) => {
    const width = i === 0 ? 48 : 72;
    return `<Column ss:Width="${width}"/>`;
  }).join("\n   ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${EXCEL_STYLES}
 <Worksheet ss:Name="${xmlEsc(sheetName)}">
  <Table>
   ${columnDefs}
   ${metaRows.join("\n   ")}
   ${sectionBlocks.join("\n   ")}
  </Table>
  <FreezePanes/>
  <FrozenNoSplit/>
  <SplitHorizontal>${headerRowIndex}</SplitHorizontal>
  <TopRowBottomPane>${headerRowIndex}</TopRowBottomPane>
  <ActivePane>2</ActivePane>
 </Worksheet>
</Workbook>`;
}

export function adminSectionsExcelBytes(
  meta: AdminCsvMeta,
  sections: ExcelTextSection[],
  options?: { sheetName?: string },
): Uint8Array {
  const xml = buildAdminSectionsExcelXml(meta, sections, options);
  return new TextEncoder().encode("\uFEFF" + xml);
}
