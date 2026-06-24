import Link from "next/link";
import type { FinanceDocument } from "@/lib/admin/finance-types";
import { traitementsHref } from "@/lib/admin/traitement-nav";

export function FinanceDocumentOriginCell({ document }: { document: FinanceDocument }) {
  const label = document.sourceLabel ?? "—";

  if (document.sourceType === "traitement" && document.sourceId) {
    const type = document.sourceTraitementType === "vente" ? "vente" : "achat";
    return (
      <Link
        href={traitementsHref({ type, id: document.sourceId })}
        className="text-[#de7a3a] hover:underline"
      >
        {label}
      </Link>
    );
  }

  return <span>{label}</span>;
}
