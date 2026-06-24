import { isGasoilStockItem } from "@/lib/admin/gasoil-stock";
import type { TraitementLineInput, TraitementSupplyKind } from "@/lib/admin/traitement-types";
import type { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Supabase = ReturnType<typeof getSupabaseAdminClient>;

type LineLike = {
  productId?: string | null;
  reference?: string;
  designation?: string;
  unit?: string;
};

export function isGasoilTraitementLine(
  line: LineLike,
  product?: { reference?: string; designation?: string; category?: string } | null,
): boolean {
  if (
    isGasoilStockItem({
      reference: line.reference,
      designation: line.designation,
    })
  ) {
    return true;
  }
  if (product) {
    return isGasoilStockItem({
      reference: product.reference,
      designation: product.designation,
      category: product.category,
    });
  }
  return false;
}

export async function inferTraitementSupplyKind(
  supabase: Supabase,
  organizationId: string,
  lines: TraitementLineInput[],
): Promise<TraitementSupplyKind> {
  let hasGasoil = false;
  let hasArticles = false;

  for (const line of lines) {
    let product: { reference?: string; designation?: string; category?: string } | null = null;
    if (line.productId?.trim()) {
      const { data } = await supabase
        .from("admin_products")
        .select("reference, designation, category")
        .eq("id", line.productId.trim())
        .eq("organization_id", organizationId)
        .maybeSingle();
      product = data as typeof product;
    }

    if (isGasoilTraitementLine(line, product)) {
      hasGasoil = true;
    } else {
      hasArticles = true;
    }
  }

  if (hasGasoil && hasArticles) {
    throw new Error(
      "Un traitement ne peut pas mélanger gasoil et articles — créez un traitement séparé pour chaque type.",
    );
  }

  return hasGasoil ? "gasoil" : "articles";
}

export function inferDraftTraitementSupplyKind(
  lines: LineLike[],
  productsById?: Map<string, { reference?: string; designation?: string; category?: string }>,
): TraitementSupplyKind | "mixed" | null {
  const active = lines.filter((l) => (l.designation ?? "").trim() || (l.reference ?? "").trim());
  if (active.length === 0) return null;

  let hasGasoil = false;
  let hasArticles = false;
  for (const line of active) {
    const product =
      line.productId?.trim() && productsById?.get(line.productId.trim())
        ? productsById.get(line.productId.trim())
        : null;
    if (isGasoilTraitementLine(line, product ?? null)) {
      hasGasoil = true;
    } else {
      hasArticles = true;
    }
  }

  if (hasGasoil && hasArticles) return "mixed";
  return hasGasoil ? "gasoil" : "articles";
}
