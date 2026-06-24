"use client";

import { useCallback, useMemo, useState } from "react";

export type ToastKind = "success" | "error" | "info";

export function useAdminToast() {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);

  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback((message: string, kind: ToastKind = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const success = useCallback((message: string) => show(message, "success"), [show]);
  const error = useCallback((message: string) => show(message, "error"), [show]);
  const info = useCallback((message: string) => show(message, "info"), [show]);

  return useMemo(
    () => ({
      toast,
      dismiss,
      success,
      error,
      info,
    }),
    [toast, dismiss, success, error, info],
  );
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

export type AlertDialogOptions = {
  title?: string;
  okLabel?: string;
};

type ConfirmDeleteFn = (label: string, options?: ConfirmDeleteOptions) => Promise<boolean>;
type AlertDialogFn = (message: string, options?: AlertDialogOptions) => Promise<void>;

let confirmDeleteImpl: ConfirmDeleteFn | null = null;
let alertDialogImpl: AlertDialogFn | null = null;

export function registerConfirmDelete(fn: ConfirmDeleteFn | null) {
  confirmDeleteImpl = fn;
}

export function registerAlertDialog(fn: AlertDialogFn | null) {
  alertDialogImpl = fn;
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

export async function alertDialog(message: string, options?: AlertDialogOptions) {
  if (alertDialogImpl) {
    await alertDialogImpl(message, options);
    return;
  }
  window.alert(options?.title ? `${options.title}\n\n${message}` : message);
}
