import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { bonSerieNumbersMatch } from "@/lib/admin/bon-number-duplicate";
import {
  formatBonLocationNo,
  parseSeqFromContractNo,
} from "@/lib/admin/rental-bon-number-format";

export { BON_NUMBER_LENGTH, formatBonLocationNo } from "@/lib/admin/rental-bon-number-format";

export async function nextBonLocationNumber(organizationId: string) {
  const { data } = await getSupabaseAdminClient()
    .from("admin_rental_contracts")
    .select("contract_no")
    .eq("organization_id", organizationId);

  let maxSeq = 0;
  for (const row of data ?? []) {
    const seq = parseSeqFromContractNo(String(row.contract_no ?? ""));
    if (seq !== null) maxSeq = Math.max(maxSeq, seq);
  }
  return formatBonLocationNo(maxSeq + 1);
}

export async function resolveBonLocationNo(organizationId: string, provided?: string) {
  const formatted = formatBonLocationNo(provided ?? "");
  if (formatted) return formatted;
  return nextBonLocationNumber(organizationId);
}

export async function bonLocationNoIsTaken(
  organizationId: string,
  bonNo: string,
  excludeContractId?: string,
): Promise<boolean> {
  const normalized = formatBonLocationNo(bonNo);
  if (!normalized) return false;

  const { data } = await getSupabaseAdminClient()
    .from("admin_rental_contracts")
    .select("id, contract_no")
    .eq("organization_id", organizationId);

  for (const row of data ?? []) {
    if (excludeContractId && row.id === excludeContractId) continue;
    if (bonSerieNumbersMatch(String(row.contract_no ?? ""), normalized)) return true;
  }
  return false;
}
