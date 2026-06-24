import type { ReactNode } from "react";
import { btnSecondary, moduleTitle } from "@/components/admin/admin-form-styles";

export function OpsModuleHeader({
  title,
  description,
  exportHref,
  actions,
}: {
  title: string;
  description: string;
  exportHref?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h2 className={moduleTitle}>{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--graphite)]/80">{description}</p>
      </div>
      <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
        {actions}
        {exportHref ? (
          <a href={exportHref} className={`${btnSecondary} w-full sm:w-auto`}>
            Exporter CSV
          </a>
        ) : null}
      </div>
    </div>
  );
}
