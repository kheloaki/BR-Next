import type { ReactNode } from "react";
import { tableClass, tableScrollWrap } from "@/components/admin/admin-form-styles";

/** Table body for use inside {@link AdminInventoryCard} (no extra card border). */
export function AdminTableWrap({ children }: { children: ReactNode }) {
  return (
    <div className={tableScrollWrap}>
      <table className={`${tableClass} [&_tbody_tr:last-child_td]:border-b-0`}>{children}</table>
    </div>
  );
}
