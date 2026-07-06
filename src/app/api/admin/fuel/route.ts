import { NextResponse } from "next/server";
import { parseExportFormat } from "@/lib/admin/admin-csv-export";
import { loadFuelJournal } from "@/lib/admin/fuel-bon-sync";
import { fuelJournalCsv } from "@/lib/admin/ops-csv-export";
import { requireAdminUserId } from "@/lib/admin/require-admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdminUserId();
  if ("error" in auth) return auth.error;
  const { organizationId } = auth;
  const supabase = getSupabaseAdminClient();

  try {
    const rows = await loadFuelJournal(supabase, organizationId);

    const exportFormat = new URL(request.url).searchParams.get("format");
    if (exportFormat === "csv" || exportFormat === "excel" || exportFormat === "xls") {
      return fuelJournalCsv(rows, parseExportFormat(exportFormat));
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
