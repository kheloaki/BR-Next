/** Moroccan vehicle plate: serial | letter | wilaya — stored as `12345-A-12`. */

export type MatriculeParts = {
  serial: string;
  letter: string;
  wilaya: string;
};

export function parseMatricule(value: string): MatriculeParts {
  const t = value.trim();
  if (!t) return { serial: "", letter: "", wilaya: "" };

  const delimited = t.split(/[-|/\s]+/).filter(Boolean);
  if (delimited.length >= 3) {
    return {
      serial: delimited[0] ?? "",
      letter: (delimited[1] ?? "").slice(0, 1),
      wilaya: delimited[2] ?? "",
    };
  }
  if (delimited.length === 2) {
    return { serial: delimited[0] ?? "", letter: (delimited[1] ?? "").slice(0, 1), wilaya: "" };
  }

  const compact = t.match(/^(\d+)([A-Za-z\u0600-\u06FF])(\d+)$/);
  if (compact) {
    return { serial: compact[1], letter: compact[2], wilaya: compact[3] };
  }

  return { serial: t, letter: "", wilaya: "" };
}

export function formatMatricule(parts: MatriculeParts): string {
  const serial = parts.serial.replace(/\D/g, "");
  const letter = parts.letter.replace(/[^A-Za-z\u0600-\u06FF]/g, "").slice(0, 1).toUpperCase();
  const wilaya = parts.wilaya.replace(/\D/g, "").slice(0, 2);
  if (!serial && !letter && !wilaya) return "";
  if (!letter && !wilaya) return serial;
  if (!wilaya) return letter ? `${serial}-${letter}` : serial;
  return `${serial}-${letter}-${wilaya}`;
}

export function isMatriculeComplete(value: string): boolean {
  const p = parseMatricule(value);
  return Boolean(p.serial && p.letter && p.wilaya);
}
