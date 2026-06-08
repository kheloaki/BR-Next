import type { GasoilBonExportData } from "@/lib/admin/gasoil-bon-export-data";

function xmlEsc(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(col: number, value: string, bold = false) {
  const style = bold ? ' ss:StyleID="Header"' : "";
  return `<Cell ss:Index="${col}"${style}><Data ss:Type="String">${xmlEsc(value)}</Data></Cell>`;
}

function commandeRows(data: GasoilBonExportData) {
  return [
    `<Row>${cell(1, "BON DE COMMANDE GASOIL", true)}</Row>`,
    `<Row>${cell(1, "N° document")}${cell(2, data.number)}</Row>`,
    `<Row>${cell(1, "Chantier")}${cell(2, data.chantier)}</Row>`,
    `<Row>${cell(1, "Date")}${cell(2, data.bonDate)}</Row>`,
    `<Row></Row>`,
    `<Row>${cell(1, "Réf.", true)}${cell(2, "Désignation", true)}${cell(3, "Qté commandée", true)}</Row>`,
    `<Row>${cell(1, "GASOIL")}${cell(2, "Gasoil — approvisionnement chantier")}${cell(3, data.litres)}</Row>`,
    `<Row></Row>`,
    `<Row>${cell(1, "Compteur pompe")}${cell(2, data.pumpMeter)}</Row>`,
    `<Row>${cell(1, "Fournisseur")}${cell(2, data.supplier)}</Row>`,
    `<Row>${cell(1, "Notes")}${cell(2, data.notes)}</Row>`,
  ];
}

function sortieRows(data: GasoilBonExportData) {
  return [
    `<Row>${cell(1, "BON DE SORTIE GASOIL", true)}</Row>`,
    `<Row>${cell(1, "N°")}${cell(2, data.number)}</Row>`,
    `<Row>${cell(1, "Catégorie")}${cell(2, data.vehicleCategoryLabel)}</Row>`,
    `<Row>${cell(1, "Chantier")}${cell(2, data.chantier)}</Row>`,
    `<Row></Row>`,
    `<Row>${cell(1, "Date", true)}${cell(2, "Équipement / Matricule", true)}${cell(3, "Compteur (H/km)", true)}${cell(4, "Heure", true)}${cell(5, "Litres", true)}</Row>`,
    `<Row>${cell(1, data.bonDate)}${cell(2, data.equipment)}${cell(3, data.pumpMeter)}${cell(4, data.fuelTime)}${cell(5, data.litres)}</Row>`,
    `<Row></Row>`,
    `<Row>${cell(1, "Conducteur", true)}${cell(2, "Pompiste", true)}${cell(3, "Responsable", true)}</Row>`,
    `<Row>${cell(1, data.driver)}${cell(2, data.pompiste)}${cell(3, data.supervisor)}</Row>`,
  ];
}

/** Excel 2003 XML — opens in Microsoft Excel without extra dependencies. */
export function buildGasoilBonExcelXml(data: GasoilBonExportData): string {
  const rows = data.bonType === "achat" ? commandeRows(data) : sortieRows(data);

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Bon gasoil">
  <Table>
   <Column ss:Width="120"/>
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   ${rows.join("\n   ")}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function gasoilBonExcelBytes(data: GasoilBonExportData): Uint8Array {
  const xml = buildGasoilBonExcelXml(data);
  return new TextEncoder().encode("\uFEFF" + xml);
}
