import { checkDatabaseHealth } from "@/lib/data-db";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = createApiHandler({
  // Health endpoint is public (used by load balancers, monitoring)
  auth: { required: false },
  enforceSecurity: false,
  handler: async () => {
    const health = await checkDatabaseHealth();
    const status = health.connected ? 200 : 503;
    const memoryUsage = process.memoryUsage();

    return {
      data: {
        status: health.connected ? "healthy" : "unhealthy",
        database: health,
        timestamp: new Date().toISOString(),
        version: "3.0.0",
        uptime: Math.floor(process.uptime()),
        memory: {
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        },
        environment: process.env.NODE_ENV || "development",
        services: {
          redis: process.env.REDIS_URL ? "configured" : "not_configured",
          s3: process.env.S3_ENDPOINT ? "configured" : "not_configured",
          sentry: process.env.SENTRY_DSN ? "configured" : "not_configured",
          stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "not_configured",
          spid: process.env.SPID_ENTITY_ID ? "configured" : "not_configured",
        },
      },
      status,
    };
  },
});
