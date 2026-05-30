"use client";

import type { ReactNode } from "react";
import { btnSecondary } from "@/components/admin/admin-form-styles";

export function AdminDataSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <div
        className="absolute inset-0 bg-black/30 animate-in fade-in duration-200"
        onClick={onClose}
        role="presentation"
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full ${width} flex-col border-l border-border bg-white shadow-xl animate-in slide-in-from-right duration-300`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-data-sheet-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-2">
            <h4 id="admin-data-sheet-title" className="text-lg font-semibold text-[var(--navy)]">
              {title}
            </h4>
            {description ? (
              <p className="mt-1 text-sm text-[var(--graphite)]/80">{description}</p>
            ) : null}
          </div>
          <button type="button" className={`${btnSecondary} shrink-0`} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-4 py-4 sm:px-5">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
