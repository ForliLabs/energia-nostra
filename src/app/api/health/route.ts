import { checkDatabaseHealth } from "@/lib/data-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await checkDatabaseHealth();
  const status = health.connected ? 200 : 503;
  return Response.json({
    status: health.connected ? "healthy" : "unhealthy",
    database: health,
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  }, { status });
}
