"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import {
  consumeSkipAdminNavPush,
  isCrossPageAdminNav,
  pushAdminNavHistory,
} from "@/lib/admin/admin-nav-history";

export function AdminNavHistoryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevRef = useRef<string | null>(null);

  const current = useMemo(() => {
    const q = searchParams.toString();
    return q ? `${pathname}?${q}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!pathname.startsWith("/admin")) return;

    if (consumeSkipAdminNavPush()) {
      prevRef.current = current;
      return;
    }

    const prev = prevRef.current;
    if (prev && prev.startsWith("/admin") && isCrossPageAdminNav(prev, current)) {
      pushAdminNavHistory(prev);
    }
    prevRef.current = current;
  }, [current, pathname]);

  return children;
}
