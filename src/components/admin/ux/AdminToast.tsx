"use client";

import type { ToastKind } from "@/components/admin/ux/useAdminToast";

const styles: Record<ToastKind, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-[#f0d4b8] bg-[#fff8f0] text-[#7a3d12]",
};

export function AdminToast({
  message,
  kind,
  onDismiss,
}: {
  message: string | null;
  kind?: ToastKind;
  onDismiss?: () => void;
}) {
  if (!message) return null;
  const k = kind ?? "success";
  return (
    <div
      role="status"
      className={`fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px)+1rem)] right-4 z-[100] max-w-sm rounded-md border px-4 py-3 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 lg:bottom-5 lg:right-5 ${styles[k]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        {onDismiss ? (
          <button type="button" onClick={onDismiss} className="opacity-60 hover:opacity-100 text-lg leading-none">
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
