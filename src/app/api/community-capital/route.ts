import { getCommunityCapitalDashboard } from "@/lib/community-capital";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-bertinoro";
  const dashboard = await getCommunityCapitalDashboard(cerId);
  return Response.json(dashboard);
}
