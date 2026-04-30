import { getProcessingRecords } from "@/lib/gdpr";

export async function GET() {
  const records = getProcessingRecords();
  return Response.json({ records, count: records.length });
}
