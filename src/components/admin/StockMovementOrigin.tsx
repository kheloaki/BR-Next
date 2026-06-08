"use client";

import Link from "next/link";
import type { StockTraitementLink } from "@/lib/admin/stock-traitement-link";
import { traitementStockHref, traitementStockOriginLabel } from "@/lib/admin/stock-traitement-link";

export function StockMovementOrigin({
  link,
}: {
  link: StockTraitementLink | null;
}) {
  if (!link) {
    return <span className="text-[var(--graphite)]/70">Manuel</span>;
  }

  return (
    <Link
      href={traitementStockHref(link)}
      className="text-[var(--navy)] underline underline-offset-2 text-xs font-medium whitespace-nowrap"
      title="Ouvrir le traitement source"
    >
      {traitementStockOriginLabel(link)}
    </Link>
  );
}
