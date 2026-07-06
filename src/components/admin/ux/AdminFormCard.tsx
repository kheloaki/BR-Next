import type { ReactNode } from "react";
import { card, labelClass } from "@/components/admin/admin-form-styles";

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
    <div className={`${card} p-4`}>
      <p className={labelClass}>{title}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--graphite)]/70">{hint}</p> : null}
      <div className="mt-3 space-y-2">{children}</div>
      {footer ? <div className="mt-3 border-t border-border pt-3">{footer}</div> : null}
    </div>
  );
}
