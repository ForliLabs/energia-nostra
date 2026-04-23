import { getCerProfile, getMembers, getEnergyData, getEnergySummary } from "@/lib/data-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [cer, members, months, totals] = await Promise.all([
    getCerProfile(),
    getMembers(),
    getEnergyData(),
    getEnergySummary(),
  ]);
  const latestMonth = months[months.length - 1];
  return Response.json({
    cer,
    latestMonth,
    months,
    totals,
    memberBreakdown: members.map((member) => ({
      id: member.id,
      name: member.name,
      type: member.type,
      podCode: member.podCode,
      energyBalanceKwh: member.energyBalanceKwh,
    })),
  });
}
