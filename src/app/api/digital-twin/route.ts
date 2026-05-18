import { getDigitalTwinDashboard } from "@/lib/energy-digital-twin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cerId = searchParams.get("cerId") || "cer-forli-centro";
  const dashboard = await getDigitalTwinDashboard(cerId);
  return Response.json(dashboard);
}
