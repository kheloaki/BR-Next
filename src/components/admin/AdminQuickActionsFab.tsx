"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ADMIN_QUICK_ACTION_GROUPS } from "@/lib/admin/admin-quick-actions";

export function AdminQuickActionsFab() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Fermer le menu actions"
          className="fixed inset-0 z-[85] bg-black/35 lg:bg-black/25"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="fixed bottom-6 right-4 z-[90] flex flex-col items-end gap-3 sm:right-6 lg:hidden">
        {open ? (
          <div
            role="dialog"
            aria-label="Actions rapides ERP"
            className="w-[min(calc(100vw-2rem),380px)] max-h-[min(72dvh,560px)] overflow-y-auto rounded-[var(--admin-radius-lg)] border border-border bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <div className="sticky top-0 z-10 border-b border-border bg-white/95 px-4 py-3 backdrop-blur-sm">
              <p className="text-sm font-semibold text-[var(--navy)]">Actions rapides</p>
              <p className="text-xs text-[var(--graphite)]/65">Créations et accès ERP — disponible partout</p>
            </div>
            <div className="px-2 py-2">
              {ADMIN_QUICK_ACTION_GROUPS.map((group) => (
                <div key={group.label} className="mb-1 last:mb-0">
                  <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--graphite)]/55">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.actions.map((action) => (
                      <li key={action.href + action.label}>
                        <Link
                          href={action.href}
                          className="flex flex-col rounded-[var(--admin-radius-md)] px-3 py-2.5 transition hover:bg-[var(--muted)]"
                          onClick={() => setOpen(false)}
                        >
                          <span className="text-sm font-medium text-[var(--navy)]">{action.label}</span>
                          {action.hint ? (
                            <span className="text-xs text-[var(--graphite)]/60">{action.hint}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Fermer les actions rapides" : "Ouvrir les actions rapides ERP"}
          title="Actions rapides ERP"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--navy-deep)] text-xl font-light leading-none text-white shadow-lg transition hover:scale-105 active:scale-95"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`block transition-transform duration-200 ${open ? "rotate-45" : ""}`}>+</span>
        </button>
      </div>
    </>
  );
}
