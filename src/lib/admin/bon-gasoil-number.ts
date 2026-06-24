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

/** Prochain N° document commande pour l'année : 001/2026, 002/2026… (comptage séquentiel). */
export async function nextBonCommandeDocumentNo(organizationId: string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const { data } = await getSupabaseAdminClient()
    .from("admin_gasoil_bons")
    .select("number")
    .eq("organization_id", organizationId)
    .eq("bon_type", "achat");

  let count = 0;
  for (const row of data ?? []) {
    if (parseCommandeDocumentSeq(String(row.number ?? ""), y) !== null) count += 1;
  }
  return formatBonCommandeDocumentNo(count + 1, y);
}

export async function resolveBonGasoilNo(
  organizationId: string,
  provided?: string,
  bonType: GasoilBonType = "sortie",
  year?: number,
) {
  const trimmed = provided?.trim() ?? "";
  if (bonType === "achat") {
    return nextBonCommandeDocumentNo(organizationId, year);
  }
  const formatted = formatBonLocationNo(trimmed);
  if (formatted) return formatted;
  return nextBonGasoilNumber(organizationId);
}
