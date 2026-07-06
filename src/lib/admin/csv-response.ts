import { simpleCsvResponse } from "@/lib/admin/admin-csv-export";
import type { AdminCsvMeta, AdminExportFormat } from "@/lib/admin/admin-csv-export";

/** @deprecated Prefer adminCsvResponse / simpleCsvResponse from admin-csv-export */
export function csvResponse(
  filename: string,
  headers: string[],
  rows: string[][],
  options?: Partial<AdminCsvMeta> & { format?: AdminExportFormat },
) {
  return simpleCsvResponse(filename, headers, rows, options);
}
