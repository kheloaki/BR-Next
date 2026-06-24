"use client";

import type { ComponentPropsWithoutRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useAdminBack } from "@/components/admin/ux/useAdminBack";

type Props = Omit<ComponentPropsWithoutRef<"button">, "type" | "onClick"> & {
  fallback?: string;
  label?: string;
  showIcon?: boolean;
  className?: string;
};

export function AdminBackLink({
  fallback,
  label,
  showIcon = true,
  className = "inline-flex items-center gap-1 text-xs text-[var(--graphite)]/70 transition hover:text-[var(--navy)]",
  ...buttonProps
}: Props) {
  const { goBack, canGoBack, label: autoLabel } = useAdminBack(fallback);
  const text = label ?? autoLabel;

  if (!canGoBack) return null;

  return (
    <button type="button" onClick={goBack} className={className} {...buttonProps}>
      {showIcon ? <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {text}
    </button>
  );
}
