"use client";

import type { ReactNode } from "react";
import { AdminToast } from "@/components/admin/ux/AdminToast";
import { useAdminToast } from "@/components/admin/ux/useAdminToast";

export type AdminToastApi = ReturnType<typeof useAdminToast>;

export function AdminModuleShell({
  children,
}: {
  children: ReactNode | ((toast: AdminToastApi) => ReactNode);
}) {
  const toast = useAdminToast();
  return (
    <>
      {typeof children === "function" ? children(toast) : children}
      <AdminToast message={toast.toast?.message ?? null} kind={toast.toast?.kind} onDismiss={toast.dismiss} />
    </>
  );
}
