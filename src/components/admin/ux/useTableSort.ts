"use client";

import { useCallback, useMemo, useState } from "react";
import {
  applyTableSort,
  nextSortState,
  type SortDirection,
  type SortState,
} from "@/lib/admin/table-sort";

export function useTableSort(initialKey?: string, initialDir: SortDirection = "desc") {
  const [sort, setSort] = useState<SortState | null>(
    initialKey ? { key: initialKey, dir: initialDir } : null,
  );

  const onSort = useCallback((key: string) => {
    setSort((current) => nextSortState(current, key));
  }, []);

  const applySort = useCallback(
    <T>(rows: T[], accessors: Record<string, (row: T) => unknown>) =>
      applyTableSort(rows, sort, accessors),
    [sort],
  );

  return useMemo(
    () => ({
      sort,
      onSort,
      applySort,
    }),
    [sort, onSort, applySort],
  );
}
