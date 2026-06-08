"use client";

import { btnSecondary, inputClass } from "@/components/admin/admin-form-styles";
import { AdminDataSheet } from "@/components/admin/ux/AdminDataSheet";

export type PurchaseRequestDaKind = "articles" | "gasoil";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (kind: PurchaseRequestDaKind) => void;
};

const OPTIONS: {
  kind: PurchaseRequestDaKind;
  title: string;
  description: string;
  hint: string;
}[] = [
  {
    kind: "articles",
    title: "Articles & pièces",
    description: "Pièces, consommables, matériaux — catalogue et stock articles.",
    hint: "BC → BL → Facture (stock articles)",
  },
  {
    kind: "gasoil",
    title: "Gasoil",
    description: "Réapprovisionnement carburant pour un chantier (litres).",
    hint: "BC → Réception gasoil → Facture (stock citerne)",
  },
];

export function PurchaseRequestKindPickerSheet({ open, onClose, onPick }: Props) {
  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title="Nouvelle demande d'achat"
      description="Choisissez le type de DA à créer."
      width="max-w-lg"
      footer={
        <button type="button" className={btnSecondary} onClick={onClose}>
          Annuler
        </button>
      }
    >
      <div className="grid gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.kind}
            type="button"
            className={`${inputClass} text-left transition hover:border-[var(--gold)] hover:bg-[var(--gold)]/5`}
            onClick={() => onPick(opt.kind)}
          >
            <span className="block font-semibold text-[var(--navy)]">{opt.title}</span>
            <span className="mt-1 block text-sm text-[var(--graphite)]/80">{opt.description}</span>
            <span className="mt-2 block text-xs text-[var(--graphite)]/60">{opt.hint}</span>
          </button>
        ))}
      </div>
    </AdminDataSheet>
  );
}
