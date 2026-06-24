"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { currentAdminPageUrl } from "@/lib/admin/admin-list-form-nav";
import { withAdminReturnUrl } from "@/lib/admin/admin-return-url";

type Props = ComponentProps<typeof Link>;

/** Internal admin link that remembers the current page for Retour. */
export function AdminLink({ href, ...props }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const resolved =
    typeof href === "string"
      ? href
      : typeof href === "object" && href.pathname
        ? `${href.pathname}${href.search ? `?${href.search}` : ""}`
        : "";

  const destPath = resolved.split("?")[0];
  const isCrossAdmin =
    resolved.startsWith("/admin") && destPath !== pathname && destPath.length > 0;

  const finalHref = isCrossAdmin
    ? withAdminReturnUrl(resolved, currentAdminPageUrl(pathname, searchParams))
    : href;

  return <Link href={finalHref} {...props} />;
}
