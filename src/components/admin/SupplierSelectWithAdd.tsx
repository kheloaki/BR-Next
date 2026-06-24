"use client";

import { useMemo, useState } from "react";
import type { Supplier } from "@/components/admin/devis-types";
import { SupplierSupplyTypesPicker } from "@/components/admin/SupplierSupplyTypesPicker";
import {
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { formatSupplierDisplayName } from "@/lib/admin/map-supplier";
import {
  SUPPLIER_SUPPLY_TYPE_LABELS,
  supplierMatchesSupplyType,
  type SupplierSupplyType,
} from "@/lib/admin/supplier-types";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admin/SearchableSelect";

type Props = {
  suppliers: Supplier[];
  /** When set, only suppliers matching this type are listed. Omit to show all suppliers. */
  supplyType?: SupplierSupplyType;
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
  const defaultNewTypes = (): SupplierSupplyType[] => (supplyType ? [supplyType] : ["divers"]);
  const [newTypes, setNewTypes] = useState<SupplierSupplyType[]>(defaultNewTypes);

  const filtered = useMemo(
    () =>
      supplyType == null
        ? suppliers
        : suppliers.filter((s) => supplierMatchesSupplyType(s.supplyTypes ?? [], supplyType)),
    [suppliers, supplyType],
  );

  const options = useMemo((): SearchableSelectOption[] => {
    return filtered.map((s) => ({
      value: s.id,
      label: `${formatSupplierDisplayName(s.supplierName, s.companyName, s.name)}${s.city ? ` · ${s.city}` : ""}`,
      keywords: `${s.supplierName ?? ""} ${s.companyName ?? ""} ${s.name} ${s.ice ?? ""} ${s.city ?? ""}`,
    }));
  }, [filtered]);

  const supplyTypeLabel =
    supplyType && SUPPLIER_SUPPLY_TYPE_LABELS[supplyType as keyof typeof SUPPLIER_SUPPLY_TYPE_LABELS]
      ? SUPPLIER_SUPPLY_TYPE_LABELS[supplyType as keyof typeof SUPPLIER_SUPPLY_TYPE_LABELS]
      : supplyType;

  async function submitSupplier() {
    if (!newSupplierName.trim() && !newCompanyName.trim()) {
      setError("Indiquez le nom du fournisseur et/ou la société.");
      return;
    }
    if (newTypes.length === 0) {
      setError("Sélectionnez au moins un type d'approvisionnement.");
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
    setNewTypes(defaultNewTypes());
    setOpen(false);
  }

  return (
    <>
      <div className="flex gap-2">
        <SearchableSelect
          options={options}
          value={value}
          onChange={(id) => {
            const supplier = filtered.find((s) => s.id === id);
            onChange(id, supplier?.name ?? "");
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <button
          type="button"
          className={`${btnSecondary} shrink-0 px-3`}
          onClick={() => {
            setError(null);
            setNewSupplierName("");
            setNewCompanyName("");
            setNewBankName("");
            setNewRib("");
            setNewTypes(defaultNewTypes());
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
        description={
          supplyType
            ? `Enregistré dans le carnet — type ${supplyTypeLabel}.`
            : "Enregistré dans le carnet fournisseurs."
        }
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
          <SupplierSupplyTypesPicker
            className="sm:col-span-2"
            value={newTypes}
            onChange={setNewTypes}
            label="Types d'approvisionnement"
          />
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </AdminDataSheet>
    </>
  );
}
