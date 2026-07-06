import { ficheAmountClass, inventoryPanelTitle, panel } from "@/components/admin/admin-form-styles";
import type { ProjectDashboard } from "@/components/admin/operations-types";
import { formatMoney } from "@/lib/admin/price-ht-ttc";

const COST_ITEMS: {
  key: keyof ProjectDashboard["costBreakdown"];
  label: string;
  fillVar: string;
}[] = [
  { key: "materials", label: "Coût des matériaux", fillVar: "var(--fiche-cost-materials)" },
  { key: "labor", label: "Main d'œuvre", fillVar: "var(--fiche-cost-labor)" },
  { key: "other", label: "Autres dépenses", fillVar: "var(--fiche-cost-other)" },
];

export function ProjectCostBreakdownCard({
  breakdown,
  totalCostMad,
}: {
  breakdown: ProjectDashboard["costBreakdown"];
  totalCostMad: number;
}) {
  const max = Math.max(...COST_ITEMS.map((item) => breakdown[item.key]), 1);

  return (
    <div className={panel}>
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h3 className={inventoryPanelTitle}>Détail des coûts</h3>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {COST_ITEMS.map((item) => {
          const value = breakdown[item.key];
          const width = value > 0 ? `${Math.max(10, (value / max) * 100)}%` : "0%";

          return (
            <div key={item.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="text-[var(--graphite)]/80">{item.label}</span>
                <span className={`shrink-0 ${ficheAmountClass}`}>{formatMoney(value)} MAD</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--background)]">
                <div
                  className="h-full rounded-full"
                  style={{ width, backgroundColor: item.fillVar }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="border-t border-border bg-[var(--background)]/60 px-4 py-3 text-sm text-[var(--graphite)]/80 sm:px-5">
        Coût total chantier :{" "}
        <span className={`${ficheAmountClass} text-[var(--navy)]`}>{formatMoney(totalCostMad)} MAD</span>
      </p>
    </div>
  );
}
