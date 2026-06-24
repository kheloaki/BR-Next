"use client";

import { AdminBackLink } from "@/components/admin/ux/AdminBackLink";
import { btnSecondary, moduleWrap } from "@/components/admin/admin-form-styles";
import { OpsModuleHeader } from "@/components/admin/OpsModuleHeader";

export function AdminComingSoonPanel({
  title,
  description = "Ce module sera disponible prochainement.",
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className={moduleWrap}>
      <OpsModuleHeader title={title} description={description} />
      <div className="rounded-xl border border-dashed border-border bg-white px-6 py-14 text-center">
        <p className="inline-flex rounded-full bg-[var(--gold)]/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--navy)]">
          Bientôt disponible
        </p>
        <p className="mt-4 text-sm text-[var(--graphite)]/75 max-w-md mx-auto">{description}</p>
        <AdminBackLink
          fallback="/admin"
          label="Retour au tableau de bord"
          showIcon={false}
          className={`${btnSecondary} mt-6 inline-flex`}
        />
      </div>
    </div>
  );
}
