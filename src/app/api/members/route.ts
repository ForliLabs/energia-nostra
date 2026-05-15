import { getMembers, createMember, memberExistsByPod, type MemberType } from "@/lib/data-db";
import { createApiHandler, ApiError } from "@/lib/api-handler";
import { schemas } from "@/lib/validation";

export const dynamic = "force-dynamic";

// Map user-facing (English) role values from the validation schema to the
// Italian member-type values stored in the database.
const roleToMemberType: Record<string, MemberType> = {
  prosumer: "prosumer",
  consumer: "consumatore",
  producer: "produttore",
};

export const GET = createApiHandler({
  auth: { required: true, roles: ["admin", "member", "auditor", "superadmin"] },
  handler: async () => {
    const members = await getMembers();
    return { data: members };
  },
});

export const POST = createApiHandler({
  auth: { required: true, roles: ["admin", "superadmin"] },
  schema: schemas.memberCreate,
  handler: async ({ body }) => {
    const payload = body as { name: string; pod: string; role?: string; fiscalCode: string; email: string };
    const name = payload.name;
    const podCode = payload.pod;

    // Convert validated English role to Italian MemberType; default to "prosumer".
    const type: MemberType = payload.role
      ? roleToMemberType[payload.role] ?? "prosumer"
      : "prosumer";

    if (await memberExistsByPod(podCode)) {
      throw new ApiError(409, "Esiste già un membro con questo POD.");
    }

    const member = await createMember({
      name,
      type,
      podCode,
      energyBalanceKwh: 0,
    });

    return { data: member, status: 201 };
  },
});
