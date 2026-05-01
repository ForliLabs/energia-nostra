import { generateOpenApiSpec } from "@/lib/openapi";

export const dynamic = "force-dynamic";

export async function GET() {
  const spec = generateOpenApiSpec();
  return Response.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
