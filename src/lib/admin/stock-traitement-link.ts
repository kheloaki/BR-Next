import type { TraitementStepKey, TraitementType } from "@/lib/admin/traitement-types";
import { TRAITEMENT_STEP_LABELS } from "@/lib/admin/traitement-types";
import { traitementsHref } from "@/lib/admin/traitement-nav";

export type StockTraitementLink = {
  traitementId: string;
  traitementType: TraitementType | null;
  step: TraitementStepKey;
  docNumber: string | null;
};

const MARKER_RE = /^traitement:(?:(achat|vente):)?([^:]+):(bl|br)\b/;

export function parseStockTraitementLink(notes: string): StockTraitementLink | null {
  const trimmed = notes.trim();
  if (!trimmed.includes("traitement:")) return null;

  const head = trimmed.split("·")[0]?.trim() ?? trimmed;
  const match = head.match(MARKER_RE);
  if (!match) return null;

  const traitementType = (match[1] as TraitementType | undefined) ?? null;
  const traitementId = match[2]!;
  const step = match[3] as TraitementStepKey;

  const docPart = trimmed.includes("·") ? trimmed.split("·").slice(1).join("·").trim() : null;

  return {
    traitementId,
    traitementType,
    step,
    docNumber: docPart || null,
  };
}

export function isTraitementStockMovement(notes: string): boolean {
  return parseStockTraitementLink(notes) != null;
}

export function traitementStockHref(link: StockTraitementLink): string {
  return traitementsHref({
    type: link.traitementType ?? "achat",
    id: link.traitementId,
  });
}

export function traitementStockOriginLabel(link: StockTraitementLink): string {
  const typeLabel =
    link.traitementType === "achat"
      ? "Achat"
      : link.traitementType === "vente"
        ? "Vente"
        : "Traitement";
  const stepLabel = TRAITEMENT_STEP_LABELS[link.step];
  const doc = link.docNumber ? ` · ${link.docNumber}` : "";
  return `${typeLabel} ${stepLabel}${doc}`;
}
