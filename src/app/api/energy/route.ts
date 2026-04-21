import { cerMembers, cerProfile, energyData, energySummary, latestEnergyMonth } from "@/lib/data";

export async function GET() {
  return Response.json({
    cer: cerProfile,
    latestMonth: latestEnergyMonth,
    months: energyData,
    totals: energySummary,
    memberBreakdown: cerMembers.map((member) => ({
      id: member.id,
      name: member.name,
      type: member.type,
      podCode: member.podCode,
      energyBalanceKwh: member.energyBalanceKwh,
    })),
  });
}
