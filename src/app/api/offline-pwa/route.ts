import { getServiceWorkerConfig, CACHE_STRATEGIES, generateManifest } from "@/lib/offline-pwa";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view"); // config | manifest | status

  if (view === "manifest") {
    const tenantName = searchParams.get("tenantName") || undefined;
    const primaryColor = searchParams.get("primaryColor") || undefined;
    const manifest = generateManifest(tenantName, primaryColor);
    return Response.json(manifest);
  }

  if (view === "config") {
    const config = getServiceWorkerConfig();
    return Response.json(config);
  }

  // Default: return sync status summary
  return Response.json({
    serviceWorkerSupported: true,
    cacheStrategies: CACHE_STRATEGIES.length,
    offlineCapable: true,
    indexedDbStores: ["energyData", "memberData", "offlineQueue", "cacheMeta", "dashboardConfig", "notifications"],
    syncTag: "energia-nostra-sync",
    version: "4.0.0",
  });
}
