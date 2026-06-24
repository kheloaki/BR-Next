import { handleSituationEnginsRoute } from "@/lib/admin/situation-engins-route";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleSituationEnginsRoute(request, id);
}
