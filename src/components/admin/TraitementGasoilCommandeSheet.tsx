"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminProject, StockItem } from "@/components/admin/operations-types";
import type { Supplier } from "@/components/admin/devis-types";
import {
  EMPTY_GASOIL_BON_FORM,
  validateGasoilBonForm,
  type GasoilBonFormState,
} from "@/components/admin/FuelGasoilBonForm";
import { FuelGasoilBonCommandeForm } from "@/components/admin/FuelGasoilBonCommandeForm";
import type { Traitement } from "@/lib/admin/traitement-types";
import { btnPrimary, btnSecondary } from "@/components/admin/admin-form-styles";
import { AdminDataSheet } from "@/components/admin/ux/AdminDataSheet";
import { readApiError } from "@/components/admin/ux/useAdminToast";

type Props = {
  open: boolean;
  traitement: Traitement | null;
  projects: AdminProject[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export function TraitementGasoilCommandeSheet({
  open,
  traitement,
  projects,
  onClose,
  onSaved,
  onSuccess,
  onError,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [gasoilStock, setGasoilStock] = useState<StockItem | null>(null);
  const [form, setForm] = useState<GasoilBonFormState>({
    ...EMPTY_GASOIL_BON_FORM,
    bonType: "achat",
  });

  const fetchNextNumber = useCallback(async () => {
    const res = await fetch("/api/admin/fuel/bons?next=1&bonType=achat", { cache: "no-store" });
    if (!res.ok) return "";
    const data = (await res.json()) as { number?: string };
    return data.number ?? "";
  }, []);

  useEffect(() => {
    if (!open || !traitement) return;
    void (async () => {
      const [bonNumber, suppliersRes, stockRes] = await Promise.all([
        fetchNextNumber(),
        fetch("/api/admin/suppliers?supplyType=gasoil", { cache: "no-store" }),
        fetch("/api/admin/fuel/stock", { cache: "no-store" }),
      ]);
      if (suppliersRes.ok) setSuppliers((await suppliersRes.json()) as Supplier[]);

      let stockPrice: number | "" = "";
      if (stockRes.ok) {
        const { item } = (await stockRes.json()) as { item: StockItem | null };
        setGasoilStock(item);
        if (item?.unitPrice && item.unitPrice > 0) stockPrice = item.unitPrice;
      }

      const line = traitement.lines[0];
      const bc = traitement.steps.bc;

      setForm({
        ...EMPTY_GASOIL_BON_FORM,
        bonType: "achat",
        bonNumber: bc?.docNumber?.trim() || bonNumber,
        projectId: traitement.projectId || "",
        bonDate: bc?.docDate || new Date().toISOString().slice(0, 10),
        litres: line?.qty ?? "",
        unitPricePerLitre:
          line?.unitPrice && line.unitPrice > 0 ? line.unitPrice : stockPrice,
        supplier: traitement.partnerName || "",
        notes: "",
        pumpMeter: "",
      });
    })();
  }, [open, traitement, fetchNextNumber]);

  async function save() {
    if (!traitement) return;
    const err = validateGasoilBonForm(form);
    if (err) {
      onError(err);
      return;
    }
    const L = typeof form.litres === "number" ? form.litres : Number(form.litres);
    setSaving(true);
    const res = await fetch("/api/admin/traitements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: traitement.id,
        registerStep: "gasoil_bc",
        bcDocNumber: form.bonNumber.trim() || undefined,
        bcDocDate: form.bonDate,
        bcSupplier: form.supplier.trim(),
        bcSupplierId: form.supplierId || undefined,
        bcLitres: L,
        bcUnitPricePerLitre:
          typeof form.unitPricePerLitre === "number" && form.unitPricePerLitre > 0
            ? form.unitPricePerLitre
            : undefined,
        bcPumpMeter: form.pumpMeter.trim() ? Number(form.pumpMeter) : undefined,
        bcNotes: form.notes.trim(),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      onError(await readApiError(res));
      return;
    }
    onSuccess(`Bon de commande gasoil enregistré — N° ${form.bonNumber || "attribué"}.`);
    await onSaved();
    onClose();
  }

  if (!traitement) return null;

  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title="Bon de commande gasoil (BC)"
      description={`Traitement ${traitement.number} — mêmes champs que Carburant → Bon de commande gasoil. Stock mis à jour à la réception (BL).`}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
            {saving ? "Enregistrement…" : "Enregistrer le BC"}
          </button>
        </>
      }
    >
      <FuelGasoilBonCommandeForm
        embedded
        form={form}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        projects={projects}
        suppliers={suppliers}
        onSupplierAdded={(s) => setSuppliers((prev) => [...prev, s])}
      />
      {gasoilStock ? (
        <p className="mt-3 text-xs text-[var(--graphite)]/65">
          Stock citerne actuel : {gasoilStock.qty.toLocaleString("fr-FR")} L
        </p>
      ) : null}
    </AdminDataSheet>
  );
}
