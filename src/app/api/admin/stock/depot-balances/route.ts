import { NextResponse } from "next/server";
import { listDepotStockBalances } from "@/lib/admin/depot-stock-server";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const depotId = url.searchParams.get("depotId")?.trim() || undefined;
  const stockItemId = url.searchParams.get("stockItemId")?.trim() || undefined;

  try {
    const supabase = getSupabaseAdminClient();
    const balances = await listDepotStockBalances(supabase, auth.organizationId, {
      depotId,
      stockItemId,
    });

    const depotIds = [...new Set(balances.map((b) => b.depotId))];
    const itemIds = [...new Set(balances.map((b) => b.stockItemId))];

    const [{ data: depots }, { data: items }] = await Promise.all([
      depotIds.length
        ? supabase.from("admin_depots").select("id, name").in("id", depotIds)
        : Promise.resolve({ data: [] }),
      itemIds.length
        ? supabase.from("admin_stock_items").select("id, reference, designation, unit").in("id", itemIds)
        : Promise.resolve({ data: [] }),
    ]);

    const depotName = new Map((depots ?? []).map((d) => [d.id as string, d.name as string]));
    const itemMeta = new Map(
      (items ?? []).map((i) => [
        i.id as string,
        {
          reference: (i.reference as string) || "",
          designation: (i.designation as string) || "",
          unit: (i.unit as string) || "PIECE",
        },
      ]),
    );

    return NextResponse.json(
      balances.map((b) => ({
        ...b,
        depotName: depotName.get(b.depotId) ?? b.depotId,
        ...(itemMeta.get(b.stockItemId) ?? { reference: "", designation: "", unit: "PIECE" }),
      })),
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur chargement stock dépôt" },
      { status: 500 },
    );
  }
}
