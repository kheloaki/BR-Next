import { NextResponse } from "next/server";
import type { ProjectReportFormat } from "@/lib/admin/project-report-types";

export function reportResponse(
  filename: string,
  format: ProjectReportFormat,
  bytes: ArrayBuffer | Uint8Array | string,
): NextResponse {
  if (format === "csv") {
    const body = typeof bytes === "string" ? bytes : new TextDecoder().decode(bytes);
    return new NextResponse("\uFEFF" + body.replace(/^\uFEFF/, ""), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }
  if (format === "html") {
    const body = typeof bytes === "string" ? bytes : new TextDecoder().decode(bytes);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  }

  const buf =
    typeof bytes === "string"
      ? Buffer.from(bytes, "utf8")
      : Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));

  if (format === "excel") {
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
