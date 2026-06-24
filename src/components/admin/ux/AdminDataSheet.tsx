"use client";

import type { ReactNode } from "react";
import { btnSecondary, labelClass } from "@/components/admin/admin-form-styles";

/** Full width on mobile; at least half the viewport on desktop. */
export const ADMIN_DATA_SHEET_WIDTH_DEFAULT =
  "w-full sm:w-1/2 sm:min-w-[50vw] sm:max-w-[min(90vw,56rem)]";

/** Wide multi-section sheets (DA, long forms). */
export const ADMIN_DATA_SHEET_WIDTH_WIDE =
  "w-full sm:w-3/5 sm:min-w-[50vw] sm:max-w-[min(95vw,80rem)]";

export function AdminSheetField({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <p className={labelClass}>
        {label}
        {required ? " *" : ""}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-[var(--graphite)]/65">{hint}</p> : null}
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function AdminDataSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = ADMIN_DATA_SHEET_WIDTH_DEFAULT,
  zIndex = 200,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  zIndex?: number;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex }}>
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
