"use client";

import { useMemo, useState } from "react";
import type { Supplier } from "@/components/admin/devis-types";
import {
  categorySegmentBtnSelected,
  categorySegmentBtnUnselected,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import {
  SUPPLIER_SUPPLY_TYPE_LABELS,
  SUPPLIER_SUPPLY_TYPES,
  supplierMatchesSupplyType,
  type SupplierSupplyType,
} from "@/lib/admin/supplier-types";
import { formatSupplierDisplayName } from "@/lib/admin/map-supplier";
import { readApiError } from "@/components/admin/ux/useAdminToast";

type Props = {
  suppliers: Supplier[];
  supplyType: SupplierSupplyType;
  value: string;
  onChange: (supplierId: string, name: string) => void;
  onSupplierAdded?: (supplier: Supplier) => void;
  placeholder?: string;
};

export function SupplierSelectWithAdd({
  suppliers,
  supplyType,
  value,
  onChange,
  onSupplierAdded,
  placeholder = "— Fournisseur —",
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newIce, setNewIce] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newRib, setNewRib] = useState("");
  const [newTypes, setNewTypes] = useState<SupplierSupplyType[]>([supplyType]);

  const filtered = useMemo(
    () => suppliers.filter((s) => supplierMatchesSupplyType(s.supplyTypes ?? [], supplyType)),
    [suppliers, supplyType],
  );

  function toggleType(t: SupplierSupplyType) {
    setNewTypes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t],
    );
  }

  async function submitSupplier() {
    if (!newSupplierName.trim() && !newCompanyName.trim()) {
      setError("Indiquez le nom du fournisseur et/ou la société.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierName: newSupplierName.trim(),
        companyName: newCompanyName.trim(),
        ice: newIce.trim(),
        city: newCity.trim(),
        contact: newContact.trim(),
        bankName: newBankName.trim(),
        rib: newRib.trim(),
        supplyTypes: newTypes,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readApiError(res));
      return;
    }
    const created = (await res.json()) as Supplier;
    onChange(created.id, created.name);
    onSupplierAdded?.(created);
    setNewSupplierName("");
    setNewCompanyName("");
    setNewIce("");
    setNewCity("");
    setNewContact("");
    setNewBankName("");
    setNewRib("");
    setNewTypes([supplyType]);
    setOpen(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <select
          className={`${inputClass} min-w-0 flex-1`}
          value={value}
          onChange={(e) => {
            const id = e.target.value;
            const supplier = filtered.find((s) => s.id === id);
            onChange(id, supplier?.name ?? "");
          }}
        >
          <option value="">{placeholder}</option>
          {filtered.map((s) => (
            <option key={s.id} value={s.id}>
              {formatSupplierDisplayName(s.supplierName, s.companyName, s.name)}
              {s.city ? ` · ${s.city}` : ""}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`${btnSecondary} shrink-0 px-3`}
          onClick={() => {
            setError(null);
            setNewSupplierName("");
            setNewCompanyName("");
            setNewBankName("");
            setNewRib("");
            setNewTypes([supplyType]);
            setOpen(true);
          }}
          title="Créer un fournisseur"
          aria-label="Créer un fournisseur"
        >
          +
        </button>
      </div>

      <AdminDataSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau fournisseur"
        description={`Enregistré dans le carnet — type ${SUPPLIER_SUPPLY_TYPE_LABELS[supplyType]}.`}
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void submitSupplier()}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <div className={formGridClass}>
          <AdminSheetField label="Nom fournisseur">
            <input
              className={inputClass}
              placeholder="Raison sociale ou contact"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
            />
          </AdminSheetField>
          <AdminSheetField label="Société">
            <input
              className={inputClass}
              placeholder="Dénomination légale"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
            />
          </AdminSheetField>
          <p className="sm:col-span-2 text-xs text-[var(--graphite)]/65">
            Au moins l&apos;un des deux champs est requis.
          </p>
          <AdminSheetField label="ICE">
            <input className={inputClass} placeholder="Identifiant commun de l'entreprise" value={newIce} onChange={(e) => setNewIce(e.target.value)} />
          </AdminSheetField>
          <AdminSheetField label="Ville">
            <input className={inputClass} placeholder="Ville" value={newCity} onChange={(e) => setNewCity(e.target.value)} />
          </AdminSheetField>
          <AdminSheetField label="Contact" className="sm:col-span-2" hint="Téléphone, email…">
            <input
              className={inputClass}
              placeholder="Tél. / email"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
            />
          </AdminSheetField>
          <AdminSheetField label="Banque">
            <input className={inputClass} placeholder="Nom de la banque" value={newBankName} onChange={(e) => setNewBankName(e.target.value)} />
          </AdminSheetField>
          <AdminSheetField label="RIB" className="sm:col-span-2" hint="Relevé d'identité bancaire">
            <input
              className={inputClass}
              placeholder="Numéro de compte"
              value={newRib}
              onChange={(e) => setNewRib(e.target.value)}
            />
          </AdminSheetField>
          <AdminSheetField label="Types d'approvisionnement" required className="sm:col-span-2">
            <div className="flex flex-wrap gap-1.5">
              {SUPPLIER_SUPPLY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={newTypes.includes(t) ? categorySegmentBtnSelected : categorySegmentBtnUnselected}
                  onClick={() => toggleType(t)}
                >
                  {SUPPLIER_SUPPLY_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </AdminSheetField>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
