/** N° document bon de commande gasoil — format 001/2026 (par année). */

export function formatBonCommandeDocumentNo(input: string | number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  const s = String(input).trim();
  if (!s) return "";

  const full = s.match(/^(\d+)\s*\/\s*(\d{4})$/);
  if (full) {
    const seq = parseInt(full[1], 10);
    const docYear = parseInt(full[2], 10);
    if (!Number.isNaN(seq) && seq > 0 && !Number.isNaN(docYear)) {
      return `${String(seq).padStart(3, "0")}/${docYear}`;
    }
  }

  const digits = s.replace(/\D/g, "");
  if (!digits) return "";
  const seq = parseInt(digits, 10);
  if (Number.isNaN(seq) || seq <= 0) return "";
  return `${String(seq).padStart(3, "0")}/${y}`;
}

export function parseCommandeDocumentSeq(number: string, year: number): number | null {
  const m = String(number ?? "")
    .trim()
    .match(/^(\d+)\s*\/\s*(\d{4})$/);
  if (!m || Number(m[2]) !== year) return null;
  const seq = parseInt(m[1], 10);
  return Number.isNaN(seq) || seq <= 0 ? null : seq;
}
