"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildAdminListFormHref } from "@/lib/admin/admin-list-form-nav";

type Options = {
  pathname: string;
  loading?: boolean;
  /** Tab id for create/edit view (default `form`; rental bons use `new`). */
  formTabId?: string;
};

export function useAdminListFormNav({ pathname, loading = false, formTabId = "form" }: Options) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const suppressDeepLinkRef = useRef(false);
  const [tab, setTab] = useState<string>("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const urlId = searchParams.get("id");
  const urlNew = searchParams.get("new") === "1";

  const buildHref = useCallback(
    (next: { id?: string | null; new?: boolean }) =>
      buildAdminListFormHref(pathname, searchParams, next),
    [pathname, searchParams],
  );

  const returnToList = useCallback(() => {
    suppressDeepLinkRef.current = true;
    setEditingId(null);
    setTab("list");
    if (urlId || urlNew) {
      router.replace(buildHref({}), { scroll: false });
    }
  }, [urlId, urlNew, router, buildHref]);

  const openFormNew = useCallback(() => {
    suppressDeepLinkRef.current = false;
    setEditingId(null);
    setTab(formTabId);
    router.replace(buildHref({ new: true }), { scroll: false });
  }, [formTabId, router, buildHref]);

  const openFormEdit = useCallback(
    (id: string) => {
      suppressDeepLinkRef.current = false;
      setEditingId(id);
      setTab(formTabId);
      router.replace(buildHref({ id }), { scroll: false });
    },
    [formTabId, router, buildHref],
  );

  useEffect(() => {
    if (suppressDeepLinkRef.current) {
      suppressDeepLinkRef.current = false;
      return;
    }
    if (loading) return;
    if (urlNew) {
      setEditingId(null);
      setTab(formTabId);
      return;
    }
    if (urlId) {
      setEditingId(urlId);
      setTab(formTabId);
      return;
    }
    setEditingId(null);
    setTab("list");
  }, [urlId, urlNew, loading, formTabId]);

  return {
    tab,
    setTab,
    editingId,
    setEditingId,
    returnToList,
    openFormNew,
    openFormEdit,
    isFormTab: tab === formTabId,
  };
}
