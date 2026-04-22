import { buildMember, memberStore, type MemberType } from "@/lib/data";

export const dynamic = "force-dynamic";

const validTypes: MemberType[] = ["produttore", "consumatore", "prosumer"];

export async function GET() {
  const members = await memberStore.findAll();
  const sorted = members.sort((left, right) => left.name.localeCompare(right.name, "it"));
  return Response.json(sorted);
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

  const existing = await memberStore.findAll();
  const podCode = payload.podCode.trim().toUpperCase();
  if (existing.some((member) => member.podCode === podCode)) {
    return Response.json({ error: "Esiste già un membro con questo POD." }, { status: 409 });
  }

  const member = buildMember({
    name: payload.name,
    type: payload.type,
    podCode,
    energyBalanceKwh: payload.energyBalanceKwh,
  });

  await memberStore.create(member);
  return Response.json(member, { status: 201 });
}
