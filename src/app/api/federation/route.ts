import { getFederatedIntelligenceDashboard } from "@/lib/federated-intelligence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-forli-centro";
  const dashboard = await getFederatedIntelligenceDashboard(cerId);
  return Response.json(dashboard);
}
