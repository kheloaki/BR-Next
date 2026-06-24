import Link from "next/link";
import type { Traitement, TraitementFinanceListSummary } from "@/lib/admin/traitement-types";
import { FINANCE_PAYMENT_STATUS_LABELS } from "@/lib/admin/finance-types";
import { financeFactureDetailHref } from "@/lib/admin/finance-nav";
import { formatMoney } from "@/lib/admin/price-ht-ttc";

export function TraitementFinanceTableCell({
  traitement,
}: {
  traitement: Pick<Traitement, "traitementType" | "steps" | "financeSummary">;
}) {
  const stepF = traitement.steps.f;
  if (stepF?.status !== "done") {
    return <span className="text-xs text-[var(--graphite)]/45">—</span>;
  }

  const fin: TraitementFinanceListSummary | null | undefined = traitement.financeSummary;
  if (!fin) {
    return <span className="text-xs text-[var(--graphite)]/45">—</span>;
  }

  if ("pendingSync" in fin) {
    return (
      <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
        Non sync
      </span>
    );
  }

  const statusLabel =
    FINANCE_PAYMENT_STATUS_LABELS[fin.paymentStatus as keyof typeof FINANCE_PAYMENT_STATUS_LABELS] ??
    fin.paymentStatus;

  return (
    <div className="min-w-[9rem] space-y-0.5 text-xs">
      <div className="font-medium tabular-nums text-[var(--navy)]">{formatMoney(fin.amountTtc)} MAD</div>
      <div className="tabular-nums text-[var(--graphite)]/80">
        Reste {formatMoney(fin.remainingAmount)} MAD
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={
            fin.paymentStatus === "paid"
              ? "text-emerald-700"
              : fin.paymentStatus === "partial"
                ? "text-amber-800"
                : fin.paymentStatus === "overdue"
                  ? "text-red-700"
                  : "text-[var(--graphite)]/75"
          }
        >
          {statusLabel}
        </span>
        <Link
          href={financeFactureDetailHref(fin.documentId)}
          className="text-[#de7a3a] hover:underline"
          title={fin.documentNumber}
        >
          Finance
        </Link>
      </div>
    </div>
  );
}
