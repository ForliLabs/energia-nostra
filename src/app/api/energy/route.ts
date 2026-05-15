import { getCerProfile, getMembers, getEnergyData, getEnergySummary } from "@/lib/data-db";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = createApiHandler({
  auth: { required: true, roles: ["admin", "member", "auditor", "superadmin"] },
  handler: async () => {
    const [cer, members, months, totals] = await Promise.all([
      getCerProfile(),
      getMembers(),
      getEnergyData(),
      getEnergySummary(),
    ]);
    const latestMonth = months[months.length - 1];
    return {
      data: {
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
      },
    };
  },
});
