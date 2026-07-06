/** ISO yyyy-mm-dd → affichage jj/mm/aaaa */
export function isoToFrDate(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** jj/mm/aaaa (ou séparateurs . -) → ISO yyyy-mm-dd, "" si vide, null si invalide */
export function frDateToIso(fr: string): string | null {
  const t = fr.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const d = new Date(`${iso}T12:00:00`);
  if (d.getFullYear() !== year || d.getMonth() + 1 !== month || d.getDate() !== day) return null;
  return iso;
}

export function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fr = isoToFrDate(iso.slice(0, 10));
  return fr || "—";
}

/** ISO date or datetime → jj/mm/aaaa ou jj/mm/aaaa HH:mm */
export function formatDateTimeFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const raw = iso.trim();
  const fr = isoToFrDate(raw.slice(0, 10));
  if (!fr) return "—";
  const time = raw.match(/[T ](\d{2}):(\d{2})/);
  return time ? `${fr} ${time[1]}:${time[2]}` : fr;
}

/** Normalise vers HH:mm (24 h). Chaîne vide si invalide. */
export function normalizeTime24(value: string): string {
  const t = value.trim();
  if (!t) return "";

  let match = t.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const h = Number(match[1]);
    const min = Number(match[2]);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
    return "";
  }

  match = t.match(/^(\d{1,2})h(\d{2})$/i);
  if (match) {
    const h = Number(match[1]);
    const min = Number(match[2]);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
    return "";
  }

  match = t.match(/^(\d{2})(\d{2})$/);
  if (match) {
    const h = Number(match[1]);
    const min = Number(match[2]);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }
  }

  return "";
}

export function formatTimeFr24(value: string | null | undefined): string {
  if (!value) return "—";
  const normalized = normalizeTime24(value);
  return normalized || value;
}
