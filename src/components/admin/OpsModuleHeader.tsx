import type { ReactNode } from "react";
import { btnSecondary, moduleTitle, pageSubtitle } from "@/components/admin/admin-form-styles";
import { appendExportFormat } from "@/lib/admin/admin-csv-export";

export type ModuleExportTarget = {
  label?: string;
  href: string;
};

function ExportButtons({ targets }: { targets: ModuleExportTarget[] }) {
  return (
    <>
      {targets.map((target) => {
        const prefix = target.label ? `${target.label} ` : "";
        return (
          <div key={target.href} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <a
              href={appendExportFormat(target.href, "csv")}
              className={`${btnSecondary} w-full sm:w-auto`}
            >
              {prefix}CSV
            </a>
            <a
              href={appendExportFormat(target.href, "excel")}
              className={`${btnSecondary} w-full sm:w-auto`}
            >
              {prefix}Excel
            </a>
          </div>
        );
      })}
    </>
  );
}

export function OpsModuleHeader({
  title,
  description,
  exportHref,
  exports,
  actions,
}: {
  title: string;
  description: string;
  /** Base export URL — format=csv|excel is appended automatically */
  exportHref?: string;
  /** Multiple export targets (e.g. inventaire + mouvements) */
  exports?: ModuleExportTarget[];
  actions?: ReactNode;
}) {
  const exportTargets: ModuleExportTarget[] =
    exports?.length ? exports : exportHref ? [{ href: exportHref }] : [];

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h2 className={moduleTitle}>{title}</h2>
        <p className={pageSubtitle}>{description}</p>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        {actions}
        {exportTargets.length > 0 ? <ExportButtons targets={exportTargets} /> : null}
      </div>
    </div>
  );
}
