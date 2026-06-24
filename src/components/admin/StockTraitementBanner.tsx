"use client";

import Link from "next/link";
import { btnSecondary } from "@/components/admin/admin-form-styles";
import { traitementsHref } from "@/lib/admin/traitement-nav";

export function StockTraitementBanner() {
  return (
    <div className="rounded-md border border-[#c8daf0] bg-[#f0f6fc] px-4 py-3 text-sm text-[#1a3a5c] space-y-2">
      <p>
        <strong>Entrées et sorties achat/vente</strong> passent par les traitements — pas par une saisie manuelle
        ici. Enregistrez le <strong>BL</strong> dans le traitement pour mettre à jour le stock automatiquement.
      </p>
      <p className="text-[#1a3a5c]/85">
        <strong>Un seul référentiel articles</strong> — le catalogue ({` `}
        <Link href="/admin/products" className="underline underline-offset-2">
          Carnet → Produits
        </Link>
        {` `}) définit référence, désignation et prix ; cette page affiche l&apos;<strong>inventaire</strong> (qté,
        seuil, mouvements) lié à chaque article.
      </p>
      <ul className="list-disc pl-5 space-y-0.5 text-[#1a3a5c]/90">
        <li>
          <strong>Gasoil</strong> : stock citerne, bons de sortie et journal — module{" "}
          <Link href="/admin/fuel/stock" className="font-medium underline underline-offset-2">
            Carburant
          </Link>{" "}
          (pas cette page)
        </li>
        <li>
          <strong>Achat</strong> : BC → BL (entrée stock) → Facture — puis <strong>→ Vente</strong> (même articles)
        </li>
        <li>
          <strong>Vente</strong> : Devis → BL (sortie stock) → Facture → BR (retour client)
        </li>
      </ul>
      <div className="flex flex-wrap gap-2 pt-1">
        <Link href="/admin/purchase-requests" className={btnSecondary}>
          Demandes d&apos;achat
        </Link>
        <Link href={traitementsHref({ type: "achat" })} className={btnSecondary}>
          Traitements achat
        </Link>
        <Link href={traitementsHref({ type: "vente" })} className={btnSecondary}>
          Traitements vente
        </Link>
      </div>
    </div>
  );
}
