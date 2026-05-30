"use client";

import { useCallback, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export function useAdminToast() {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);

  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback((message: string, kind: ToastKind = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  return {
    toast,
    dismiss,
    success: (message: string) => show(message, "success"),
    error: (message: string) => show(message, "error"),
    info: (message: string) => show(message, "info"),
  };
}

export async function readApiError(res: Response) {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error || `Erreur ${res.status}`;
  } catch {
    return `Erreur ${res.status}`;
  }
}

export type ConfirmDeleteOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmDeleteFn = (label: string, options?: ConfirmDeleteOptions) => Promise<boolean>;

let confirmDeleteImpl: ConfirmDeleteFn | null = null;

export function registerConfirmDelete(fn: ConfirmDeleteFn | null) {
  confirmDeleteImpl = fn;
}

export async function confirmDelete(label: string, options?: ConfirmDeleteOptions) {
  if (confirmDeleteImpl) {
    return confirmDeleteImpl(label, options);
  }
  return window.confirm(
    options?.description ??
      `Voulez-vous vraiment supprimer « ${label} » ?\n\nCette action est irréversible.`,
  );
}
