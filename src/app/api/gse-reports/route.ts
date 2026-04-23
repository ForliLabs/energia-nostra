import { getMembers, getCerProfile, getEnergyData, getIncentiveDistribution } from "@/lib/data-db";
import { generateGseReport, exportGseCsv, exportGseXml } from "@/lib/gse-reporting";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  
  const [members, cer, energyData, incentives] = await Promise.all([
    getMembers(), getCerProfile(), getEnergyData(), getIncentiveDistribution(),
  ]);
  
  const period = searchParams.get("period") || energyData[energyData.length - 1]?.label || "";
  const energyMonth = energyData.find((m) => m.label === period) || energyData[energyData.length - 1];
  const report = generateGseReport(period, energyMonth, members, incentives, cer.name);

  if (format === "csv") {
    const csv = exportGseCsv(report);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="report-gse-${period.replace(/\s+/g, "-")}.csv"`,
      },
    });
  }

  if (format === "xml") {
    const xml = exportGseXml(report);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="report-gse-${period.replace(/\s+/g, "-")}.xml"`,
      },
    });
  }

  return Response.json(report);
}
