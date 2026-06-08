import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { GasoilBonType } from "@/components/admin/operations-types";
import {
  formatBonCommandeDocumentNo,
  parseCommandeDocumentSeq,
} from "@/lib/admin/gasoil-commande-document-no";
import {
  formatBonLocationNo,
  parseSeqFromContractNo,
} from "@/lib/admin/rental-bon-number-format";

export {
  BON_NUMBER_LENGTH,
  formatBonLocationNo as formatBonGasoilNo,
} from "@/lib/admin/rental-bon-number-format";

export { formatBonCommandeDocumentNo } from "@/lib/admin/gasoil-commande-document-no";

function parseSerieSeq(number: string): number | null {
  const trimmed = String(number ?? "").trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) || n <= 0 ? null : n;
}

export async function nextBonGasoilNumber(organizationId: string) {
  const { data } = await getSupabaseAdminClient()
    .from("admin_gasoil_bons")
    .select("number")
    .eq("organization_id", organizationId)
    .eq("bon_type", "sortie");

  let maxSeq = 0;
  for (const row of data ?? []) {
    const seq =
      parseSerieSeq(String(row.number ?? "")) ??
      parseSeqFromContractNo(String(row.number ?? ""));
    if (seq !== null) maxSeq = Math.max(maxSeq, seq);
  }
  return formatBonLocationNo(maxSeq + 1);
}

/** Prochain N° document commande pour l'année en cours : 001/2026, 002/2026… */
export async function nextBonCommandeDocumentNo(organizationId: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const { data } = await getSupabaseAdminClient()
    .from("admin_gasoil_bons")
    .select("number")
    .eq("organization_id", organizationId)
    .eq("bon_type", "achat");

  let maxSeq = 0;
  for (const row of data ?? []) {
    const seq = parseCommandeDocumentSeq(String(row.number ?? ""), y);
    if (seq !== null) maxSeq = Math.max(maxSeq, seq);
  }
  return formatBonCommandeDocumentNo(maxSeq + 1, y);
}

export async function resolveBonGasoilNo(
  organizationId: string,
  provided?: string,
  bonType: GasoilBonType = "sortie",
) {
  const trimmed = provided?.trim() ?? "";
  if (bonType === "achat") {
    const formatted = formatBonCommandeDocumentNo(trimmed);
    if (formatted) return formatted;
    return nextBonCommandeDocumentNo(organizationId);
  }
  const formatted = formatBonLocationNo(trimmed);
  if (formatted) return formatted;
  return nextBonGasoilNumber(organizationId);
}
