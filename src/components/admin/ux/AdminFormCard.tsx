import type { ReactNode } from "react";
import { labelClass } from "@/components/admin/admin-form-styles";

export function AdminFormCard({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-white p-4 shadow-sm">
      <p className={labelClass}>{title}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--graphite)]/70">{hint}</p> : null}
      <div className="mt-3 space-y-2">{children}</div>
      {footer ? <div className="mt-3 pt-3 border-t border-border">{footer}</div> : null}
    </div>
  );
}
