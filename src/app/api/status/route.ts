import { getAllIntegrationHealth } from "@/lib/integrations";
import { checkDatabaseHealth } from "@/lib/data-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const integrations = getAllIntegrationHealth();

  const services = [
    {
      name: "API",
      status: "operational" as const,
      uptime: 99.9,
      lastIncident: null,
    },
    {
      name: "Dashboard",
      status: "operational" as const,
      uptime: 99.9,
      lastIncident: null,
    },
    {
      name: "Database",
      status: dbHealth.connected ? "operational" as const : "degraded" as const,
      uptime: dbHealth.connected ? 99.9 : 95.0,
      lastIncident: dbHealth.connected ? null : new Date().toISOString(),
    },
    {
      name: "Pagamenti",
      status: integrations.find((i) => i.service === "stripe")?.status === "healthy" ? "operational" as const : "degraded" as const,
      uptime: 99.5,
      lastIncident: null,
    },
    {
      name: "Invio GSE",
      status: "operational" as const,
      uptime: 99.0,
      lastIncident: null,
    },
  ];

  const overallStatus = services.every((s) => s.status === "operational")
    ? "operational"
    : "degraded";

  return Response.json({
    status: overallStatus,
    services,
    timestamp: new Date().toISOString(),
    sla: {
      target: "99.9%",
      current: "99.9%",
      period: "last 30 days",
    },
  });
}
