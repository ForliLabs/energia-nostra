import { getResilienceDashboard } from "@/lib/resilience-mesh";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const dashboard = await getResilienceDashboard(cerId);
  return Response.json(dashboard);
}
