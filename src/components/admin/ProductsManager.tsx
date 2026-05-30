"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { ProductCategorySelect } from "@/components/admin/ProductCategorySelect";
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
  thClass,
} from "@/components/admin/admin-form-styles";
import { AdminFormCard } from "@/components/admin/ux/AdminFormCard";
import { AdminInventoryCard } from "@/components/admin/ux/AdminInventoryCard";
import { AdminLoading } from "@/components/admin/ux/AdminLoading";
import { AdminMiniStats } from "@/components/admin/ux/AdminMiniStats";
import { AdminTableWrap } from "@/components/admin/ux/AdminTableWrap";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { HtTtcPriceFields } from "@/components/admin/HtTtcPriceFields";
import { ProductUnitField } from "@/components/admin/ProductUnitField";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";
import { DEFAULT_VAT_RATE, formatMoney, htToTtc } from "@/lib/admin/price-ht-ttc";
import { confirmDelete, readApiError, useAdminToast } from "@/components/admin/ux/useAdminToast";

const PRODUCT_TABS = new Set(["products", "categories"]);

export function ProductsManager() {
  const toast = useAdminToast();
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);

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

  function resetCreateForm() {
    setNewReference("");
    setNewDesignation("");
    setNewCategory("");
    setNewUnit("u");
    setNewUnitPrice(0);
  }

  async function addProduct() {
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
    toast.success("Produit ajouté.");
    resetCreateForm();
    setShowCreateForm(false);
    await load();
  }

  async function updateProduct(id: string, patch: Partial<Product>) {
    const current = products.find((p) => p.id === id);
    if (!current) return;
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        reference: patch.reference ?? current.reference,
        designation: patch.designation ?? current.designation,
        category: patch.category ?? current.category,
        unit: patch.unit ?? current.unit,
        unitPrice: patch.unitPrice ?? current.unitPrice,
      }),
    });
    if (!res.ok) toast.error(await readApiError(res));
    else await load();
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
        title="Catalogue produits"
        description="Organisez par catégories et réutilisez les articles dans le générateur de devis."
        actions={
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              if (showCreateForm) {
                resetCreateForm();
                setShowCreateForm(false);
              } else {
                setShowCreateForm(true);
              }
            }}
          >
            {showCreateForm ? "Annuler" : "Créer un produit"}
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

      {loading ? <AdminLoading /> : null}

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
                    <th className={thClass}>Catégorie</th>
                    <th className={thClass}>Produits</th>
                    <th className={thClass} />
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => (
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
          {showCreateForm ? (
            <div className="mb-4">
            <AdminFormCard
              title="Nouveau produit"
              hint={categories.length === 0 ? "Créez d'abord une catégorie dans l'onglet Catégories." : undefined}
              footer={
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => {
                      resetCreateForm();
                      setShowCreateForm(false);
                    }}
                  >
                    Annuler
                  </button>
                  <button type="button" className={btnPrimary} disabled={saving} onClick={() => void addProduct()}>
                    {saving ? "Enregistrement…" : "Ajouter le produit"}
                  </button>
                </div>
              }
            >
              <div className={formGridClass}>
                <input
                  className={inputClass}
                  placeholder="Référence"
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                />
                <input
                  className={`${inputClass} sm:col-span-2`}
                  placeholder="Désignation *"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                />
                <ProductCategorySelect categories={categories} value={newCategory} onChange={setNewCategory} />
                <ProductUnitField value={newUnit} onChange={setNewUnit} required />
                <div className="sm:col-span-2">
                  <HtTtcPriceFields
                    showLabels={false}
                    vatRate={DEFAULT_VAT_RATE}
                    valueHt={newUnitPrice}
                    onChangeHt={setNewUnitPrice}
                  />
                </div>
              </div>
            </AdminFormCard>
            </div>
          ) : null}

          <AdminInventoryCard
            title="Catalogue des produits"
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher un produit…"
            actions={
              <select
                className={`${inputClass} max-w-[160px] min-h-[38px] py-2`}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Toutes catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            }
          >
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--graphite)]/70">
                {search || filterCategory
                  ? "Aucun résultat pour ce filtre."
                  : "Aucun produit dans le catalogue."}
                {!showCreateForm ? (
                  <button type="button" className={`mt-4 ${btnPrimary}`} onClick={() => setShowCreateForm(true)}>
                    Créer un produit
                  </button>
                ) : null}
              </div>
            ) : (
              <AdminTableWrap>
                <thead>
                  <tr>
                    <th className={inventoryThClass}>Référence</th>
                    <th className={inventoryThClass}>Désignation</th>
                    <th className={inventoryThClass}>Catégorie</th>
                    <th className={inventoryThClass}>Unité</th>
                    <th className={inventoryThNumClass}>Prix unit. HT</th>
                    <th className={inventoryThNumClass}>Prix unit. TTC</th>
                    <th className={inventoryThClass} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-[var(--background)]/80 transition-colors">
                      <td className={inventoryTdClass}>{product.reference}</td>
                      <td className={inventoryTdClass}>{product.designation}</td>
                      <td className={inventoryTdClass}>{product.category || "—"}</td>
                      <td className={inventoryTdClass}>{product.unit || "u"}</td>
                      <td className={inventoryTdNumClass}>{product.unitPrice.toLocaleString("fr-MA")}</td>
                      <td className={inventoryTdNumClass}>
                        {formatMoney(htToTtc(product.unitPrice, DEFAULT_VAT_RATE))}
                      </td>
                      <td className={inventoryTdClass}>
                        <button type="button" className={btnDanger} onClick={() => void removeProduct(product)}>
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

      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </div>
  );
}
