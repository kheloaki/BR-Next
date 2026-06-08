import { handleProjectReportRoute } from "@/lib/admin/reports/handle-project-report-route";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleProjectReportRoute(request, id, "stock");
}
