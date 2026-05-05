import { getMoonshotVppDashboard } from "@/lib/moonshot-vpp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const dashboard = await getMoonshotVppDashboard(cerId);
  return Response.json(dashboard);
}
