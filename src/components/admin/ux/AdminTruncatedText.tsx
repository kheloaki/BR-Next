"use client";

import { useEffect, useState } from "react";

export function AdminTruncatedText({
  text,
  lines = 2,
  className = "",
}: {
  text?: string | null;
  lines?: 1 | 2;
  className?: string;
}) {
  const display = (text ?? "").trim() || "—";
  const isEmpty = display === "—";
  const [open, setOpen] = useState(false);
  const clampClass = lines === 1 ? "truncate" : "line-clamp-2";

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

  if (isEmpty) {
    return <span className={`text-[var(--graphite)]/55 ${className}`}>—</span>;
  }

  return (
    <>
      <button
        type="button"
        title={display}
        className={`block w-full min-w-0 max-w-[min(100%,20rem)] text-left ${clampClass} ${
          className || "text-[var(--navy)]"
        } cursor-help hover:underline hover:decoration-[var(--gold)]/60 hover:underline-offset-2`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {display}
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[120] bg-black/25"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Texte complet"
            className="fixed left-1/2 top-1/2 z-[121] w-[min(calc(100vw-2rem),32rem)] max-h-[min(70dvh,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--navy)]">
              {display}
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-[var(--navy)] hover:bg-[var(--background)]"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
