"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CustomerSelect } from "@/components/admin/CustomerSelect";
import type { Customer } from "@/components/admin/devis-types";
import type { Traitement } from "@/lib/admin/traitement-types";
import { btnPrimary, btnSecondary, inputClass } from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import { formatMoney } from "@/lib/admin/price-ht-ttc";
import { traitementsHref } from "@/lib/admin/traitement-nav";

type Props = {
  open: boolean;
  traitement: Traitement | null;
  customers: Customer[];
  onClose: () => void;
  onCreated: (venteId: string) => void | Promise<void>;
  onError: (message: string) => void;
};

type DraftLine = {
  id: string;
  designation: string;
  reference: string;
  unit: string;
  qty: number;
  unitPrice: number;
};

export function TraitementAchatToVenteSheet({
  open,
  traitement,
  customers,
  onClose,
  onCreated,
  onError,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [label, setLabel] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);

  useEffect(() => {
    if (!open || !traitement) return;
    setCustomerId("");
    setCustomerName("");
    setLabel(`Vente — ${traitement.label.trim() || traitement.number}`);
    setLines(
      traitement.lines.map((line) => ({
        id: line.id,
        designation: line.designation,
        reference: line.reference,
        unit: line.unit,
        qty: line.qty,
        unitPrice: line.unitPrice,
      })),
    );
  }, [open, traitement]);

  function updateLine(id: string, patch: Partial<Pick<DraftLine, "qty" | "unitPrice">>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function submit() {
    if (!traitement) return;
    if (!customerId && !customerName.trim()) {
      onError("Sélectionnez ou saisissez un client.");
      return;
    }
    if (lines.some((l) => l.qty <= 0)) {
      onError("Chaque ligne doit avoir une quantité > 0.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/traitements/${encodeURIComponent(traitement.id)}/vente`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId || undefined,
        customerName: customerName.trim() || undefined,
        label: label.trim() || undefined,
        lines: lines.map((l) => ({ id: l.id, qty: l.qty, unitPrice: l.unitPrice })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }
    const { traitementId } = (await res.json()) as { traitementId: string };
    await onCreated(traitementId);
    onClose();
  }

  if (!traitement) return null;

  const totalHt = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);

  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title="Passer en traitement vente"
      description={`Suite de ${traitement.number} — reprenez les articles, ajustez qté et prix de vente.`}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submit()}>
            {saving ? "Création…" : "Créer traitement vente"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <AdminSheetField label="Objet vente">
          <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} />
        </AdminSheetField>
        <AdminSheetField label="Client" required>
          <CustomerSelect
            customers={customers}
            value={customerId}
            onChange={(id) => {
              setCustomerId(id);
              const c = customers.find((x) => x.id === id);
              setCustomerName(c?.name ?? "");
            }}
            placeholder="— Client —"
            inputClassName={inputClass}
          />
        </AdminSheetField>
        <AdminSheetField label="Ou nom client">
          <input className={inputClass} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </AdminSheetField>
        <div className="rounded-lg border border-border overflow-hidden text-sm">
          <table className="w-full">
            <thead className="bg-[var(--background)]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Désignation</th>
                <th className="px-3 py-2 text-right font-semibold">Qté</th>
                <th className="px-3 py-2 text-right font-semibold">P.U. HT</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className="block">{line.designation || line.reference}</span>
                    {line.reference ? (
                      <span className="text-xs text-[var(--graphite)]/60">{line.reference}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number"
                        min={0}
                        step={line.unit === "PIECE" ? 1 : 0.01}
                        className={`${inputClass} w-20 text-right tabular-nums`}
                        value={line.qty}
                        onChange={(e) => updateLine(line.id, { qty: Number(e.target.value) || 0 })}
                      />
                      <span className="text-xs text-[var(--graphite)]/60">{line.unit}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className={`${inputClass} w-28 text-right tabular-nums ml-auto block`}
                      value={line.unitPrice}
                      onChange={(e) => updateLine(line.id, { unitPrice: Number(e.target.value) || 0 })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm font-medium text-[var(--navy)]">Total HT vente : {formatMoney(totalHt)}</p>
        <p className="text-xs text-[var(--graphite)]/65">
          Achat lié :{" "}
          <Link href={traitementsHref({ type: "achat", id: traitement.id })} className="underline">
            {traitement.number}
          </Link>
        </p>
      </div>
    </AdminDataSheet>
  );
}

export function canConvertAchatToVente(row: Traitement): boolean {
  return (
    row.traitementType === "achat" &&
    row.supplyKind !== "gasoil" &&
    !row.venteTraitementId &&
    row.steps.bl?.status === "done"
  );
}
