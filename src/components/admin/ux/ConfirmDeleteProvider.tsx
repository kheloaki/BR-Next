"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { btnDanger, btnSecondary, card } from "@/components/admin/admin-form-styles";
import { registerConfirmDelete, registerAlertDialog, type AlertDialogOptions, type ConfirmDeleteOptions } from "@/components/admin/ux/useAdminToast";

type PendingConfirm = {
  kind: "confirm";
  label: string;
  options?: ConfirmDeleteOptions;
  resolve: (confirmed: boolean) => void;
};

type PendingAlert = {
  kind: "alert";
  message: string;
  options?: AlertDialogOptions;
  resolve: () => void;
};

type PendingDialog = PendingConfirm | PendingAlert;

const ConfirmDeleteContext = createContext<{
  confirmDelete: (label: string, options?: ConfirmDeleteOptions) => Promise<boolean>;
} | null>(null);

export function ConfirmDeleteProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDialog | null>(null);

  const confirmDelete = useCallback((label: string, options?: ConfirmDeleteOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ kind: "confirm", label, options, resolve });
    });
  }, []);

  const alertDialog = useCallback((message: string, options?: AlertDialogOptions) => {
    return new Promise<void>((resolve) => {
      setPending({ kind: "alert", message, options, resolve });
    });
  }, []);

  useEffect(() => {
    registerConfirmDelete(confirmDelete);
    registerAlertDialog(alertDialog);
    return () => {
      registerConfirmDelete(null);
      registerAlertDialog(null);
    };
  }, [confirmDelete, alertDialog]);

  const closeConfirm = (confirmed: boolean) => {
    if (pending?.kind !== "confirm") return;
    pending.resolve(confirmed);
    setPending(null);
  };

  const closeAlert = () => {
    if (pending?.kind !== "alert") return;
    pending.resolve();
    setPending(null);
  };

  const title =
    pending?.kind === "alert"
      ? (pending.options?.title ?? "Information")
      : (pending?.options?.title ?? "Confirmer la suppression");
  const description =
    pending?.kind === "alert"
      ? pending.message
      : (pending?.options?.description ??
        (pending?.kind === "confirm"
          ? `Voulez-vous vraiment supprimer « ${pending.label} » ? Cette action est irréversible.`
          : ""));
  const confirmLabel =
    pending?.kind === "alert"
      ? (pending.options?.okLabel ?? "OK")
      : (pending?.options?.confirmLabel ?? "Supprimer");
  const cancelLabel = pending?.kind === "confirm" ? (pending.options?.cancelLabel ?? "Annuler") : null;

  return (
    <ConfirmDeleteContext.Provider value={{ confirmDelete }}>
      {children}
      {pending ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          role="presentation"
          onClick={() => (pending.kind === "alert" ? closeAlert() : closeConfirm(false))}
        >
          <div className="absolute inset-0 bg-[var(--navy-deep)]/55 backdrop-blur-[2px]" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-desc"
            className={`relative w-full max-w-md ${card} p-6 shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-delete-title" className="text-lg font-semibold text-[var(--navy)]">
              {title}
            </h2>
            <p id="confirm-delete-desc" className="mt-3 text-sm leading-relaxed text-[var(--graphite)]">
              {description}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {cancelLabel ? (
                <button type="button" className={btnSecondary} onClick={() => closeConfirm(false)}>
                  {cancelLabel}
                </button>
              ) : null}
              <button
                type="button"
                className={
                  pending.kind === "alert"
                    ? `${btnSecondary} min-h-[44px] bg-[var(--navy)] px-4 text-white hover:bg-[var(--navy)]/90`
                    : `${btnDanger} min-h-[44px] bg-red-600 px-4 text-white hover:bg-red-700`
                }
                onClick={() => (pending.kind === "alert" ? closeAlert() : closeConfirm(true))}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmDeleteContext.Provider>
  );
}

export function useConfirmDelete() {
  const ctx = useContext(ConfirmDeleteContext);
  if (!ctx) {
    throw new Error("useConfirmDelete must be used within ConfirmDeleteProvider");
  }
  return ctx;
}
