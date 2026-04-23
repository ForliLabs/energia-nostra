import { multiCerData, getMultiCerStats } from "@/lib/multi-cer";

export async function GET() {
  const stats = getMultiCerStats();
  return Response.json({ cers: multiCerData, stats });
}
