import { inventoryPanelTitle, panel } from "@/components/admin/admin-form-styles";
import { ProjectCumulativeCostChart } from "@/components/admin/ProjectCumulativeCostChart";
import type { ProjectDashboard } from "@/components/admin/operations-types";

export function ProjectCumulativeCostPanel({
  series,
}: {
  series: ProjectDashboard["cumulativeCost"];
}) {
  return (
    <div className={panel}>
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h3 className={inventoryPanelTitle}>Évolution du coût cumulé</h3>
      </div>
      <div className="px-4 py-4 sm:px-5">
        <ProjectCumulativeCostChart series={series} />
      </div>
    </div>
  );
}
