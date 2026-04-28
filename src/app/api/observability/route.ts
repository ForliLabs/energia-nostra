import { getHealthDashboardData } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const windowMinutes = parseInt(searchParams.get("window") || "60");

  const data = await getHealthDashboardData(windowMinutes);

  return Response.json({
    ...data,
    window: `${windowMinutes}m`,
    generatedAt: new Date().toISOString(),
  });
}
