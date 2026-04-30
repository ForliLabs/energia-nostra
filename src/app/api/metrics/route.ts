import { getPrometheusMetrics } from "@/lib/observability-v2";

export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = getPrometheusMetrics();

  return new Response(metrics, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
