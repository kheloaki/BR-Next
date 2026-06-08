import { NextResponse } from "next/server";
import { csvResponse } from "@/lib/admin/csv-response";
import { loadFuelJournal } from "@/lib/admin/fuel-bon-sync";
import { GASOIL_VEHICLE_CATEGORY_LABELS } from "@/lib/admin/gasoil-bon";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const supabase = getSupabaseAdminClient();

  try {
    const rows = await loadFuelJournal(supabase, organizationId);

    if (new URL(request.url).searchParams.get("format") === "csv") {
      return csvResponse(
        "carburant.csv",
        ["Date", "N° bon", "Catégorie", "Engin", "Litres", "Chantier", "Compteur", "Heure", "Conducteur"],
        rows.map((r) => [
          r.entryDate,
          r.ticketNo,
          r.vehicleCategory ? GASOIL_VEHICLE_CATEGORY_LABELS[r.vehicleCategory] : "",
          r.equipmentName,
          String(r.litres),
          r.siteName,
          r.meterStart != null ? String(r.meterStart) : "",
          r.fuelTime ?? "",
          r.fueledBy,
        ]),
      );
    }

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Chargement journal impossible" },
      { status: 500 },
    );
  }
}

/** Manual saisie removed — use bons gasoil (achat / sortie). */
export async function POST() {
  return NextResponse.json(
    { error: "Utilisez les bons gasoil (achat ou sortie) pour enregistrer une consommation." },
    { status: 405 },
  );
}

/** Suppression via l'onglet Bons gasoil. */
export async function DELETE() {
  return NextResponse.json(
    { error: "Supprimez le bon depuis l'onglet Bons gasoil." },
    { status: 405 },
  );
}
