"use client";

import { useEffect, useState } from "react";
import type { Traitement } from "@/lib/admin/traitement-types";
import {
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";

type Props = {
  open: boolean;
  traitement: Traitement | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function TraitementGasoilReceptionSheet({
  open,
  traitement,
  onClose,
  onSaved,
  onSuccess,
  onError,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState("");
  const [litres, setLitres] = useState(0);
  const [unitPricePerLitre, setUnitPricePerLitre] = useState(0);
  const [pumpMeter, setPumpMeter] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !traitement) return;
    const line = traitement.lines[0];
    const existing = traitement.steps.bl;
    const bc = traitement.steps.bc;
    setDocNumber(existing?.docNumber?.trim() || "");
    setDocDate(existing?.docDate || new Date().toISOString().slice(0, 10));
    setSupplier(traitement.partnerName || "");
    setLitres(line?.qty ?? 0);
    setUnitPricePerLitre(line?.unitPrice ?? 0);
    setPumpMeter("");
    setNotes(bc?.status === "done" ? `Réception liée au BC ${bc.docNumber}` : "");
  }, [open, traitement]);

  async function save() {
    if (!traitement) return;
    if (litres <= 0) {
      onError("Indiquez la quantité en litres.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/traitements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: traitement.id,
        registerStep: "gasoil_bl",
        blDocNumber: docNumber.trim() || undefined,
        blDocDate: docDate,
        blSupplier: supplier.trim(),
        blLitres: litres,
        blUnitPricePerLitre: unitPricePerLitre > 0 ? unitPricePerLitre : undefined,
        blPumpMeter: pumpMeter.trim() ? Number(pumpMeter) : undefined,
        blNotes: notes.trim(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }
    onSuccess("Réception gasoil enregistrée — stock mis à jour.");
    await onSaved();
    onClose();
  }

  if (!traitement) return null;

  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title="Réception gasoil (BL)"
      description={`Traitement ${traitement.number} — entrée stock citerne après le BC gasoil.`}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
            {saving ? "Enregistrement…" : "Enregistrer réception"}
          </button>
        </>
      }
    >
      <div className={formGridClass}>
        <AdminSheetField label="N° bon / BL" hint="N° BL fournisseur ou laisser vide pour reprendre le N° BC">
          <input className={inputClass} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
        </AdminSheetField>
        <AdminSheetField label="Date">
          <input type="date" className={inputClass} value={docDate} onChange={(e) => setDocDate(e.target.value)} />
        </AdminSheetField>
        <AdminSheetField label="Fournisseur" className="sm:col-span-2">
          <input className={inputClass} value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </AdminSheetField>
        <AdminSheetField label="Litres reçus" required>
          <input
            type="number"
            min={0}
            className={inputClass}
            value={litres}
            onChange={(e) => setLitres(Number(e.target.value) || 0)}
          />
        </AdminSheetField>
        <AdminSheetField label="Prix / litre (MAD)">
          <input
            type="number"
            min={0}
            step={0.01}
            className={inputClass}
            value={unitPricePerLitre}
            onChange={(e) => setUnitPricePerLitre(Number(e.target.value) || 0)}
          />
        </AdminSheetField>
        <AdminSheetField label="Index pompe">
          <input className={inputClass} value={pumpMeter} onChange={(e) => setPumpMeter(e.target.value)} />
        </AdminSheetField>
        <AdminSheetField label="Notes" className="sm:col-span-2">
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </AdminSheetField>
      </div>
      {traitement.steps.bc?.status !== "done" ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Enregistrez d&apos;abord le <strong>BC</strong> (bon de commande gasoil) avant la réception.
        </p>
      ) : (
        <p className="mt-3 text-xs text-[var(--graphite)]/65">
          BC enregistré : <strong>{traitement.steps.bc.docNumber}</strong> — cette étape met à jour le stock citerne.
        </p>
      )}
    </AdminDataSheet>
  );
}
