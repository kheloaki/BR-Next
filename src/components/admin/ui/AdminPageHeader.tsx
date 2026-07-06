import type { ReactNode } from "react";
import { pageEyebrow, pageSubtitle, pageTitle } from "@/components/admin/admin-form-styles";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between ${className ?? ""}`}>
      <div className="min-w-0">
        {eyebrow ? <p className={pageEyebrow}>{eyebrow}</p> : null}
        <h1 className={eyebrow ? `mt-1 ${pageTitle}` : pageTitle}>{title}</h1>
        {description ? <p className={pageSubtitle}>{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
