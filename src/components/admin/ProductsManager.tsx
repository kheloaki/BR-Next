"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { ProductCategorySelectWithAdd } from "@/components/admin/ProductCategorySelectWithAdd";
import { SearchableSelect } from "@/components/admin/SearchableSelect";
import { withEmptyOption } from "@/components/admin/searchable-options";
import { type Product, type ProductCategory } from "@/components/admin/devis-types";
import {
  btnDanger,
  btnPrimary,
  btnSecondary,
  formGridClass,
  inputClass,
  inventoryTableClass,
  inventoryTdClass,
  inventoryTdNumClass,
  inventoryThClass,
  inventoryThNumClass,
  moduleWrap,
  rowHover,
  tdClass,
  tdTextClass,
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminDataSheet, AdminSheetField } from "@/components/admin/ux/AdminDataSheet";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { ProductsPageSkeleton } from "@/components/admin/skeletons/pages";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminSortableTh } from "@/components/admin/ux/AdminSortableTh";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminTruncatedText } from "@/components/admin/ux/AdminTruncatedText";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { ProductUnitField } from "@/components/admin/ProductUnitField";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { DEFAULT_VAT_RATE, formatMoney, htToTtc } from "@/lib/admin/price-ht-ttc";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";
import { useTableSort } from "@/components/admin/ux/useTableSort";

const PRODUCT_TABS = new Set(["products", "categories"]);

export function ProductsManager() {
  const toast = useAdminToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState(() =>
    tabFromUrl && PRODUCT_TABS.has(tabFromUrl) ? tabFromUrl : "products",
  );
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  const [newReference, setNewReference] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("u");
  const [newUnitPrice, setNewUnitPrice] = useState(0);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { sort: productSort, onSort: onProductSort, applySort: applyProductSort } = useTableSort(
    "reference",
    "asc",
  );
  const { sort: categorySort, onSort: onCategorySort, applySort: applyCategorySort } = useTableSort(
    "name",
    "asc",
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }),
      fetch("/api/admin/product-categories", { cache: "no-store" }),
    ]);
    if (productsRes.ok) setProducts((await productsRes.json()) as Product[]);
    if (categoriesRes.ok) setCategories((await categoriesRes.json()) as ProductCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tabFromUrl && PRODUCT_TABS.has(tabFromUrl) && tabFromUrl !== tab) {
      setTab(tabFromUrl);
    }
  }, [tabFromUrl, tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCategory && p.category !== filterCategory) return false;
      if (!q) return true;
      return (
        p.reference.toLowerCase().includes(q) ||
        p.designation.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, filterCategory, search]);

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const k = p.category || "Sans catégorie";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const productSortAccessors = useMemo(
    () => ({
      reference: (p: Product) => p.reference,
      designation: (p: Product) => p.designation,
      category: (p: Product) => p.category,
      unit: (p: Product) => p.unit || "u",
      unitPrice: (p: Product) => p.unitPrice,
      unitPriceTtc: (p: Product) => htToTtc(p.unitPrice, DEFAULT_VAT_RATE),
    }),
    [],
  );

  const sortedProducts = useMemo(
    () => applyProductSort(filtered, productSortAccessors),
    [applyProductSort, filtered, productSortAccessors],
  );

  const categorySortAccessors = useMemo(
    () => ({
      name: (c: ProductCategory) => c.name,
      count: (c: ProductCategory) => countByCategory.get(c.name) ?? 0,
    }),
    [countByCategory],
  );

  const sortedCategories = useMemo(
    () => applyCategorySort(filteredCategories, categorySortAccessors),
    [applyCategorySort, filteredCategories, categorySortAccessors],
  );

  const categoryFilterOptions = useMemo(
    () =>
      withEmptyOption(
        categories.map((c) => ({ value: c.name, label: c.name, keywords: c.name })),
        "Toutes catégories",
      ),
    [categories],
  );

  function clearEditParam() {
    if (!searchParams.get("edit")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const qs = params.toString();
    router.replace(qs ? `/admin/products?${qs}` : "/admin/products", { scroll: false });
  }

  function closeProductSheet() {
    setProductSheetOpen(false);
    setEditingId(null);
    setNewReference("");
    setNewDesignation("");
    setNewCategory("");
    setNewUnit("u");
    setNewUnitPrice(0);
    clearEditParam();
  }

  function openCreateForm() {
    setEditingId(null);
    setNewReference("");
    setNewDesignation("");
    setNewCategory("");
    setNewUnit("u");
    setNewUnitPrice(0);
    setProductSheetOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingId(product.id);
    setNewReference(product.reference);
    setNewDesignation(product.designation);
    setNewCategory(product.category);
    setNewUnit(product.unit || "u");
    setNewUnitPrice(product.unitPrice);
    setProductSheetOpen(true);
  }

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || loading || products.length === 0) return;
    const product = products.find((p) => p.id === editId);
    if (product && editingId !== editId) {
      setTab("products");
      openEditProduct(product);
    }
  }, [searchParams, loading, products, editingId]);

  async function saveProduct() {
    if (!newDesignation.trim()) {
      toast.error("La désignation est obligatoire.");
      return;
    }
    if (!newUnit.trim()) {
      toast.error("L'unité est obligatoire (ex: u, m², t).");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId ?? undefined,
        reference: newReference.trim() || "NN",
        designation: newDesignation.trim(),
        category: newCategory,
        unit: newUnit.trim(),
        unitPrice: Math.max(0, Number(newUnitPrice) || 0),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success(editingId ? "Article mis à jour." : "Article ajouté.");
    closeProductSheet();
    await load();
  }

  async function removeProduct(product: Product) {
    if (!(await confirmDelete(product.designation || product.reference))) return;
    const res = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Produit supprimé.");
    await load();
  }

  async function addCategory() {
    if (!newCategoryName.trim()) {
      toast.error("Indiquez un nom de catégorie.");
      return;
    }
    const res = await fetch("/api/admin/product-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Catégorie créée.");
    setNewCategoryName("");
    await load();
  }

  async function renameCategory(cat: ProductCategory, name: string) {
    if (!name.trim() || name === cat.name) return;
    const res = await fetch("/api/admin/product-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, name: name.trim() }),
    });
    if (!res.ok) toast.error(await readApiError(res));
    else {
      toast.success("Catégorie mise à jour.");
      await load();
    }
  }

  async function removeCategory(cat: ProductCategory) {
    if (!(await confirmDelete(cat.name))) return;
    const res = await fetch(`/api/admin/product-categories?id=${encodeURIComponent(cat.id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await readApiError(res));
      return;
    }
    toast.success("Catégorie supprimée.");
    await load();
  }

  return (
    <div className={moduleWrap}>
      <OpsModuleHeader
        title="Catalogue articles"
        description="Référentiel unique — référence, désignation, prix. L'inventaire (qté) se met à jour automatiquement."
        actions={
          <button type="button" className={btnPrimary} onClick={openCreateForm}>
            Créer un article
          </button>
        }
      />

      {!loading ? (
        <AdminMiniStats
          items={[
            { label: "Produits", value: String(products.length) },
            { label: "Catégories", value: String(categories.length) },
            {
              label: "Sans catégorie",
              value: String(products.filter((p) => !p.category).length),
              accent: products.some((p) => !p.category) ? "alert" : undefined,
            },
          ]}
        />
      ) : null}

      <AdminTabs
        tabs={[
          { id: "products", label: `Produits (${products.length})` },
          { id: "categories", label: `Catégories (${categories.length})` },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <ProductsPageSkeleton partial /> : null}

      {tab === "categories" && !loading && (
        <>
          <AdminFormCard
            title="Nouvelle catégorie"
            footer={
              <button type="button" className={btnPrimary} onClick={() => void addCategory()}>
                Ajouter
              </button>
            }
          >
            <input
              className={inputClass}
              placeholder="ex. Modulaires, Structures, Services…"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
          </AdminFormCard>
          <AdminInventoryCard
            title="Liste des catégories"
            search={categorySearch}
            onSearchChange={setCategorySearch}
            searchPlaceholder="Rechercher une catégorie…"
          >
            {filteredCategories.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                {categorySearch ? "Aucun résultat pour ce filtre." : "Aucune catégorie dans le catalogue."}
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <AdminSortableTh
                      label="Catégorie"
                      sortKey="name"
                      sort={categorySort}
                      onSort={onCategorySort}
                    />
                    <AdminSortableTh
                      label="Produits"
                      sortKey="count"
                      sort={categorySort}
                      onSort={onCategorySort}
                    />
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {sortedCategories.map((cat) => (
                    <tr key={cat.id} className={rowHover}>
                      <td className={tdClass}>
                        <input
                          className={inputClass}
                          defaultValue={cat.name}
                          onBlur={(e) => void renameCategory(cat, e.target.value)}
                        />
                      </td>
                      <td className={tdClass}>{countByCategory.get(cat.name) ?? 0}</td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          className={btnDanger}
                          onClick={() => void removeCategory(cat)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
        </>
      )}

      {tab === "products" && !loading && (
        <>
          <AdminInventoryCard
            title="Catalogue des produits"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher un produit…"
            actions={
              <SearchableSelect
                options={categoryFilterOptions}
                value={filterCategory}
                onChange={setFilterCategory}
                placeholder="Toutes catégories"
                inputClassName={`${inputClass} max-w-[160px] min-h-[38px] py-2`}
              />
            }
          >
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                {search || filterCategory
                  ? "Aucun résultat pour ce filtre."
                  : "Aucun produit dans le catalogue."}
                <button type="button" className={`mt-4 ${btnPrimary}`} onClick={openCreateForm}>
                  Créer un article
                </button>
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <AdminSortableTh
                      label="Référence"
                      sortKey="reference"
                      sort={productSort}
                      onSort={onProductSort}
                      className={inventoryThClass}
                    />
                    <AdminSortableTh
                      label="Désignation"
                      sortKey="designation"
                      sort={productSort}
                      onSort={onProductSort}
                      className={inventoryThClass}
                    />
                    <AdminSortableTh
                      label="Catégorie"
                      sortKey="category"
                      sort={productSort}
                      onSort={onProductSort}
                      className={inventoryThClass}
                    />
                    <AdminSortableTh
                      label="Unité"
                      sortKey="unit"
                      sort={productSort}
                      onSort={onProductSort}
                      className={inventoryThClass}
                    />
                    <AdminSortableTh
                      label="Prix unit. HT"
                      sortKey="unitPrice"
                      sort={productSort}
                      onSort={onProductSort}
                      className={inventoryThNumClass}
                      align="right"
                    />
                    <AdminSortableTh
                      label="Prix unit. TTC"
                      sortKey="unitPriceTtc"
                      sort={productSort}
                      onSort={onProductSort}
                      className={inventoryThNumClass}
                      align="right"
                    />
                    <th className={inventoryThClass} />
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[var(--background)]/80 transition-colors">
                      <td className={tdTextClass}>
                        <AdminTruncatedText text={product.reference} lines={1} />
                      </td>
                      <td className={tdTextClass}>
                        <AdminTruncatedText text={product.designation} />
                      </td>
                      <td className={tdClass}>
                        <AdminTruncatedText text={product.category} lines={1} />
                      </td>
                      <td className={inventoryTdClass}>{product.unit || "u"}</td>
                      <td className={inventoryTdNumClass}>{product.unitPrice.toLocaleString("fr-MA")}</td>
                      <td className={inventoryTdNumClass}>
                        {formatMoney(htToTtc(product.unitPrice, DEFAULT_VAT_RATE))}
                      </td>
                      <td className={inventoryTdClass}>
                        <div className="flex flex-wrap gap-1">
                          <button type="button" className={btnSecondary} onClick={() => openEditProduct(product)}>
                            Modifier
                          </button>
                          <button type="button" className={btnDanger} onClick={() => void removeProduct(product)}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </AdminInventoryCard>
        </>
      )}

      <AdminDataSheet
        open={productSheetOpen}
        onClose={closeProductSheet}
        title={editingId ? "Modifier l'article" : "Nouvel article"}
        description={
          editingId
            ? "Les changements sont propagés à l'inventaire et aux traitements."
            : categories.length === 0
              ? "Créez d'abord une catégorie dans l'onglet Catégories."
              : undefined
        }
        footer={
          <>
            <button type="button" className={btnSecondary} onClick={closeProductSheet}>
              Annuler
            </button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={() => void saveProduct()}>
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
              value={newReference}
              onChange={(e) => setNewReference(e.target.value)}
            />
          </AdminSheetField>
          <AdminSheetField label="Désignation" required className="sm:col-span-2">
            <input
              className={inputClass}
              placeholder="Libellé de l'article"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
            />
          </AdminSheetField>
          <AdminSheetField label="Catégorie">
            <ProductCategorySelectWithAdd
              categories={categories}
              value={newCategory}
              onChange={setNewCategory}
              onCategoryAdded={(c) =>
                setCategories((prev) => (prev.some((x) => x.id === c.id) ? prev : [...prev, c]))
              }
            />
          </AdminSheetField>
          <AdminSheetField label="Unité" required>
            <ProductUnitField value={newUnit} onChange={setNewUnit} required />
          </AdminSheetField>
          <AdminSheetField label="Prix unitaire HT / TTC" className="sm:col-span-2">
            <HtTtcPriceFields
              vatRate={DEFAULT_VAT_RATE}
              valueHt={newUnitPrice}
              onChangeHt={setNewUnitPrice}
            />
          </AdminSheetField>
        </div>
      </AdminDataSheet>

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
