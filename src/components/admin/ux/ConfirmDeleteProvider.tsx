"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { btnDanger, btnSecondary } from "@/components/admin/admin-form-styles";
import { registerConfirmDelete, type ConfirmDeleteOptions } from "@/components/admin/ux/useAdminToast";

type PendingConfirm = {
  label: string;
  options?: ConfirmDeleteOptions;
  resolve: (confirmed: boolean) => void;
};

const ConfirmDeleteContext = createContext<{
  confirmDelete: (label: string, options?: ConfirmDeleteOptions) => Promise<boolean>;
} | null>(null);

export function ConfirmDeleteProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirmDelete = useCallback((label: string, options?: ConfirmDeleteOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ label, options, resolve });
    });
  }, []);

  useEffect(() => {
    registerConfirmDelete(confirmDelete);
    return () => registerConfirmDelete(null);
  }, [confirmDelete]);

  const close = (confirmed: boolean) => {
    pending?.resolve(confirmed);
    setPending(null);
  };

  const title = pending?.options?.title ?? "Confirmer la suppression";
  const description =
    pending?.options?.description ??
    (pending
      ? `Voulez-vous vraiment supprimer « ${pending.label} » ? Cette action est irréversible.`
      : "");
  const confirmLabel = pending?.options?.confirmLabel ?? "Supprimer";
  const cancelLabel = pending?.options?.cancelLabel ?? "Annuler";

  return (
    <ConfirmDeleteContext.Provider value={{ confirmDelete }}>
      {children}
      {pending ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          role="presentation"
          onClick={() => close(false)}
        >
          <div className="absolute inset-0 bg-[var(--navy-deep)]/55 backdrop-blur-[2px]" />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-desc"
            className="relative w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-delete-title" className="text-lg font-semibold text-[var(--navy)]">
              {title}
            </h2>
            <p id="confirm-delete-desc" className="mt-3 text-sm leading-relaxed text-[var(--graphite)]">
              {description}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={btnSecondary} onClick={() => close(false)}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`${btnDanger} min-h-[44px] bg-red-600 px-4 text-white hover:bg-red-700`}
                onClick={() => close(true)}
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
