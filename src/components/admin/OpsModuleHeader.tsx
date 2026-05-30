import type { ReactNode } from "react";
import { btnSecondary } from "@/components/admin/admin-form-styles";

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
    <div className="border-b border-border pb-4 mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-semibold text-[var(--navy)] tracking-tight">{title}</h2>
        <p className="text-sm text-[var(--graphite)]/80 mt-1 max-w-2xl">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {actions}
        {exportHref ? (
          <a href={exportHref} className={btnSecondary}>
            Exporter CSV
          </a>
        ) : null}
      </div>
    </div>
  );
}
