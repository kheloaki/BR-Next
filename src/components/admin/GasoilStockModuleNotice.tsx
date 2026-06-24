"use client";

import Link from "next/link";
import { btnSecondary } from "@/components/admin/admin-form-styles";
import { GASOIL_STOCK_MODULE_HREF, GASOIL_STOCK_MODULE_MESSAGE } from "@/lib/admin/gasoil-stock";

export function GasoilStockModuleNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-sm text-[var(--graphite)]/85">
        {GASOIL_STOCK_MODULE_MESSAGE}{" "}
        <Link href={GASOIL_STOCK_MODULE_HREF} className="font-medium text-[var(--navy)] underline underline-offset-2">
          Ouvrir Carburant → Stock gasoil
        </Link>
      </p>
    );
  }

  return (
    <div className="rounded-md border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
      <p>
        <strong>{GASOIL_STOCK_MODULE_MESSAGE}</strong> Entrées (traitement achat gasoil, réception BL), sorties (bons
        de sortie) et inventaire citerne :{" "}
        <Link href={GASOIL_STOCK_MODULE_HREF} className="font-medium underline underline-offset-2">
          Carburant → Stock gasoil
        </Link>
        .
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link href={GASOIL_STOCK_MODULE_HREF} className={btnSecondary}>
          Stock gasoil
        </Link>
        <Link href="/admin/fuel/bons" className={btnSecondary}>
          Bons de sortie
        </Link>
      </div>
    </div>
  );
}
