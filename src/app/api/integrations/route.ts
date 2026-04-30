import { getAllIntegrationHealth } from "@/lib/integrations";

export const dynamic = "force-dynamic";

export async function GET() {
  const integrations = getAllIntegrationHealth();

  const summary = {
    total: integrations.length,
    healthy: integrations.filter((i) => i.status === "healthy").length,
    degraded: integrations.filter((i) => i.status === "degraded").length,
    down: integrations.filter((i) => i.status === "down").length,
    unconfigured: integrations.filter((i) => i.status === "unconfigured").length,
  };

  return Response.json({
    status: summary.down > 0 ? "degraded" : "healthy",
    summary,
    integrations,
    timestamp: new Date().toISOString(),
  });
}
