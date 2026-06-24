"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { currentAdminPageUrl } from "@/lib/admin/admin-list-form-nav";
import {
  adminFallbackBack,
  markAdminNavBackNavigation,
  peekAdminNavBack,
  popAdminNavBack,
} from "@/lib/admin/admin-nav-history";
import { ADMIN_RETURN_PARAM } from "@/lib/admin/admin-return-url";
import { getMobilePageTitle } from "@/lib/admin/admin-mobile-nav";

export function useAdminBack(fallback?: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = useMemo(
    () => currentAdminPageUrl(pathname, searchParams),
    [pathname, searchParams],
  );

  const fb = fallback ?? adminFallbackBack(pathname);

  const explicitReturn = searchParams.get(ADMIN_RETURN_PARAM);
  const explicitHref = explicitReturn?.startsWith("/admin") ? explicitReturn : null;
  const historyHref = peekAdminNavBack(current);
  const href = explicitHref ?? historyHref ?? fb;

  const backTitle = useMemo(() => getMobilePageTitle(href.split("?")[0]), [href]);
  const canGoBack = pathname !== "/admin";

  const goBack = useCallback(() => {
    markAdminNavBackNavigation();
    const target = explicitHref ?? popAdminNavBack(current) ?? fb;
    router.push(target);
  }, [explicitHref, current, fb, router]);

  return {
    href,
    goBack,
    canGoBack,
    backTitle,
    label: `Retour · ${backTitle}`,
  };
}
