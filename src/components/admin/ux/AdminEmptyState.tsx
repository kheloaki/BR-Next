import Link from "next/link";
import { btnPrimary } from "@/components/admin/admin-form-styles";

export function AdminEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-white px-6 py-10 text-center">
      <p className="font-medium text-[var(--navy)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--graphite)]/75 max-w-md mx-auto">{description}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className={`mt-4 inline-flex ${btnPrimary}`}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button type="button" className={`mt-4 ${btnPrimary}`} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
