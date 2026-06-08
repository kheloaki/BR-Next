"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { btnPrimary } from "@/components/admin/admin-form-styles";
import { DOCUMENT_BADGE_CLASS, DOCUMENT_LABELS } from "@/components/admin/devis-types";
import {
  FACTURATION_NEW_DOCUMENT_OPTIONS,
  facturationBuilderPath,
} from "@/lib/admin/facturation-nav";

export function FacturationNewDocumentButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className={`${btnPrimary} inline-flex items-center gap-1.5`}
        onClick={() => setOpen((v) => !v)}
      >
        Nouveau
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1.5 min-w-[240px] overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg"
        >
          {FACTURATION_NEW_DOCUMENT_OPTIONS.map(({ type, shortLabel }) => (
            <Link
              key={type}
              role="menuitem"
              href={facturationBuilderPath(type)}
              className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-[var(--background)]"
              onClick={() => setOpen(false)}
            >
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold ${DOCUMENT_BADGE_CLASS[type]}`}
              >
                {shortLabel}
              </span>
              <span className="text-sm font-medium text-[var(--navy)]">{DOCUMENT_LABELS[type]}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
