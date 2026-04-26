/**
 * HTML + plain text for quote/contact requests received via Resend.
 * Inline styles only — many clients strip <style> blocks.
 */

const COLORS = {
  navy: "#0f172a",
  gold: "#b8953c",
  ivory: "#faf8f5",
  muted: "#64748b",
  border: "#e2e8f0",
  text: "#1e293b",
} as const;

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export type ParsedContactMessage = {
  company: string;
  phone: string;
  sector: string;
  /** Free-text need / message body */
  details: string;
};

/** Matches the payload built in `ContactCTA` (Company / Phone / Sector + blank + need). */
export function parseContactMessage(raw: string): ParsedContactMessage {
  const trimmed = raw.trim();
  if (
    !trimmed.includes("Company:") &&
    !trimmed.includes("Phone:") &&
    !trimmed.includes("Sector:")
  ) {
    return { company: "", phone: "", sector: "", details: trimmed };
  }

  const [block, ...restParts] = raw.split(/\n\n/);
  const details = restParts.join("\n\n").trim();
  let company = "";
  let phone = "";
  let sector = "";

  for (const line of (block ?? "").split("\n")) {
    const t = line.trim();
    if (t.startsWith("Company:")) company = t.slice("Company:".length).trim();
    else if (t.startsWith("Phone:")) phone = t.slice("Phone:".length).trim();
    else if (t.startsWith("Sector:")) sector = t.slice("Sector:".length).trim();
  }

  return {
    company,
    phone,
    sector,
    details: details || trimmed,
  };
}

function row(label: string, value: string): string {
  if (!value || value === "-") {
    return "";
  }
  const v = escapeHtml(value);
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;color:${COLORS.muted};width:140px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;color:${COLORS.text};vertical-align:top;">${v}</td>
  </tr>`;
}

export function buildContactRequestEmail(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): { html: string; text: string } {
  const subject = input.subject?.trim() || "Demande — site web";
  const parsed = parseContactMessage(input.message);

  const text = [
    "BARANE INVEST — nouvelle demande",
    "—".repeat(40),
    `Objet : ${subject}`,
    "",
    `Nom : ${input.name}`,
    `E-mail (répondre à) : ${input.email}`,
    parsed.company ? `Entreprise : ${parsed.company}` : null,
    parsed.phone ? `Téléphone : ${parsed.phone}` : null,
    parsed.sector ? `Secteur : ${parsed.sector}` : null,
    "",
    "Détails du besoin :",
    parsed.details || "(vide)",
    "",
    "—",
    "Répondez à ce message pour joindre directement le demandeur.",
  ]
    .filter(Boolean)
    .join("\n");

  const detailsBlock = escapeHtml(parsed.details || "(Non renseigné)").replaceAll(
    "\n",
    "<br/>",
  );

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:24px;background:${COLORS.navy};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:${COLORS.ivory};padding:28px 24px 8px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.gold};font-weight:600;">Barane Invest</p>
        <h1 style="margin:0 0 8px;font-size:22px;line-height:1.2;color:${COLORS.navy};font-weight:700;">Nouvelle demande</h1>
        <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted};">${escapeHtml(subject)}</p>
      </td>
    </tr>
    <tr>
      <td style="background:${COLORS.ivory};padding:0 24px 24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${row("Nom", input.name)}
          ${row("E-mail", input.email)}
          ${row("Entreprise", parsed.company)}
          ${row("Téléphone", parsed.phone)}
          ${row("Secteur", parsed.sector)}
        </table>
        <p style="margin:20px 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.muted};font-weight:600;">Détails du besoin</p>
        <div style="margin:0;padding:16px;background:#fff;border:1px solid ${COLORS.border};font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.55;color:${COLORS.text};">${detailsBlock}</div>
        <p style="margin:20px 0 0;font-size:12px;color:${COLORS.muted};line-height:1.5;">Répondez à cet e-mail pour contacter <strong style="color:${COLORS.text};">${escapeHtml(input.name)}</strong> — l’adresse <em>Reply-To</em> est déjà celle du demandeur.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}
