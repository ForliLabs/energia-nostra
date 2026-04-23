import { getMembers, createMember, memberExistsByPod, type MemberType } from "@/lib/data-db";

export const dynamic = "force-dynamic";

const validTypes: MemberType[] = ["produttore", "consumatore", "prosumer"];

export async function GET() {
  const members = await getMembers();
  return Response.json(members);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    name?: string;
    type?: MemberType;
    podCode?: string;
    energyBalanceKwh?: number;
  };

  if (!payload.name?.trim() || !payload.podCode?.trim() || typeof payload.energyBalanceKwh !== "number") {
    return Response.json(
      { error: "Compila nome, POD e saldo energetico del nuovo membro." },
      { status: 400 }
    );
  }

  if (!payload.type || !validTypes.includes(payload.type)) {
    return Response.json({ error: "Tipologia membro non valida." }, { status: 400 });
  }

  if (await memberExistsByPod(payload.podCode)) {
    return Response.json({ error: "Esiste già un membro con questo POD." }, { status: 409 });
  }

  const member = await createMember({
    name: payload.name,
    type: payload.type,
    podCode: payload.podCode,
    energyBalanceKwh: payload.energyBalanceKwh,
  });

  return Response.json(member, { status: 201 });
}
