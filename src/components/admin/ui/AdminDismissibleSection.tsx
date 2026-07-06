"use client";

import { useState } from "react";
import { AdminSectionBlock } from "@/components/admin/ui/admin-dashboard";

export function AdminDismissibleSection({
  title,
  dismissLabel = "Masquer",
  children,
}: {
  title: string;
  dismissLabel?: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <AdminSectionBlock title={title} dismissLabel={dismissLabel} onDismiss={() => setVisible(false)}>
      {children}
    </AdminSectionBlock>
  );
}
