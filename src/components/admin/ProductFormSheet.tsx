"use client";

import { useEffect, useState } from "react";
import type { Product, ProductCategory } from "@/components/admin/devis-types";
import {
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { ProductCategorySelectWithAdd } from "@/components/admin/ProductCategorySelectWithAdd";
import { ProductUnitField } from "@/components/admin/ProductUnitField";
import { readApiError } from "@/components/admin/ux/useAdminToast";
import { DEFAULT_VAT_RATE } from "@/lib/admin/price-ht-ttc";

type Props = {
  open: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
  onSaved: (product: Product) => void;
  onError?: (message: string) => void;
  vatRate?: number;
  description?: string;
  categories?: ProductCategory[];
};

export function ProductFormSheet({
  open,
  onClose,
  editingProduct,
  onSaved,
  onError,
  vatRate = DEFAULT_VAT_RATE,
  description,
  categories: categoriesProp,
}: Props) {
  const [categories, setCategories] = useState<ProductCategory[]>(categoriesProp ?? []);
  const [reference, setReference] = useState("");
  const [designation, setDesignation] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("u");
  const [unitPrice, setUnitPrice] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingId = editingProduct?.id ?? null;

  useEffect(() => {
    if (categoriesProp) setCategories(categoriesProp);
  }, [categoriesProp]);

  useEffect(() => {
    if (!open || categoriesProp) return;
    void fetch("/api/admin/product-categories", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories((data as ProductCategory[]) ?? []))
      .catch(() => setCategories([]));
  }, [open, categoriesProp]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingProduct) {
      setReference(editingProduct.reference);
      setDesignation(editingProduct.designation);
      setCategory(editingProduct.category);
      setUnit(editingProduct.unit || "u");
      setUnitPrice(editingProduct.unitPrice);
    } else {
      setReference("");
      setDesignation("");
      setCategory("");
      setUnit("u");
      setUnitPrice(0);
    }
  }, [open, editingProduct]);

  async function save() {
    if (!designation.trim()) {
      const msg = "La désignation est obligatoire.";
      setError(msg);
      onError?.(msg);
      return;
    }
    if (!unit.trim()) {
      const msg = "L'unité est obligatoire (ex: u, m², t).";
      setError(msg);
      onError?.(msg);
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId ?? undefined,
        reference: reference.trim() || "NN",
        designation: designation.trim(),
        category,
        unit: unit.trim(),
        unitPrice: Math.max(0, Number(unitPrice) || 0),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const msg = await readApiError(res);
      setError(msg);
      onError?.(msg);
      return;
    }
    const saved = (await res.json()) as Product;
    onSaved(saved);
    onClose();
  }

  const sheetDescription =
    description ??
    (editingId
      ? "Les changements sont propagés à l'inventaire et aux traitements."
      : categories.length === 0
        ? "Créez une catégorie avec + ou laissez vide."
        : "Enregistré dans le catalogue articles — réutilisable partout.");

  return (
    <AdminDataSheet
      open={open}
      onClose={onClose}
      title={editingId ? "Modifier l'article" : "Nouvel article"}
      description={sheetDescription}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose} disabled={saving}>
            Annuler
          </button>
          <button type="button" className={btnPrimary} disabled={saving} onClick={() => void save()}>
            {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Ajouter l'article"}
          </button>
        </>
      }
    >
      <div className={formGridClass}>
        <AdminSheetField label="Référence">
          <input
            className={inputClass}
            placeholder="NN si vide"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </AdminSheetField>
        <AdminSheetField label="Désignation" required className="sm:col-span-2">
          <input
            className={inputClass}
            placeholder="Libellé de l'article"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />
        </AdminSheetField>
        <AdminSheetField label="Catégorie">
          <ProductCategorySelectWithAdd
            categories={categories}
            value={category}
            onChange={setCategory}
            onCategoryAdded={(c) =>
              setCategories((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]))
            }
          />
        </AdminSheetField>
        <AdminSheetField label="Unité" required>
          <ProductUnitField value={unit} onChange={setUnit} required />
        </AdminSheetField>
        <AdminSheetField label="Prix unitaire HT / TTC" className="sm:col-span-2">
          <HtTtcPriceFields vatRate={vatRate} valueHt={unitPrice} onChangeHt={setUnitPrice} />
        </AdminSheetField>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </AdminDataSheet>
  );
}
