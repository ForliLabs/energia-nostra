import {
  generateNudges,
  getChallenges,
  getGamificationSummary,
  getLeaderboard,
  getMemberAchievements,
  joinChallenge,
} from "@/lib/gamification";
import { resolveMemberForSessionUser } from "@/lib/member-context";
import { getCurrentSession, resolveSessionCerId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const session = await getCurrentSession();
  const cerId = resolveSessionCerId(session, searchParams.get("cerId"));
  const explicitMemberId = searchParams.get("memberId");
  const member = explicitMemberId
    ? { id: explicitMemberId, name: "Membro CER", cerId }
    : session
      ? await resolveMemberForSessionUser(session.user, cerId)
      : null;
  const view = searchParams.get("view");

  if (view === "achievements") {
    if (!member) {
      return Response.json({ achievements: [] });
    }
    const achievements = await getMemberAchievements(member.id);
    return Response.json({ achievements, member });
  }

  if (view === "leaderboard") {
    const leaderboard = await getLeaderboard(cerId);
    return Response.json({ leaderboard });
  }

  if (view === "challenges") {
    const challenges = await getChallenges(cerId, member?.id);
    return Response.json({ challenges, member });
  }

  if (view === "nudges") {
    if (!member) {
      return Response.json({ nudges: [] });
    }
    const nudges = await generateNudges(member.id, cerId);
    return Response.json({ nudges, member });
  }

  const [summary, leaderboard, challenges, achievements, nudges] = await Promise.all([
    getGamificationSummary(cerId),
    getLeaderboard(cerId),
    getChallenges(cerId, member?.id),
    member ? getMemberAchievements(member.id) : Promise.resolve([]),
    member ? generateNudges(member.id, cerId) : Promise.resolve([]),
  ]);
  const memberPosition = member ? leaderboard.find((entry) => entry.memberId === member.id) ?? null : null;

  return Response.json({
    summary,
    leaderboard: leaderboard.slice(0, 10),
    challenges,
    achievements,
    nudges,
    member,
    memberPosition,
  });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return Response.json({ error: "Accedi per partecipare alle sfide della community." }, { status: 401 });
  }

  const body = (await request.json()) as { action?: string; challengeId?: string; cerId?: string };
  const cerId = resolveSessionCerId(session, body.cerId);
  const member = await resolveMemberForSessionUser(session.user, cerId);

  if (!member) {
    return Response.json({ error: "Il tuo account non è ancora associato a un membro CER, quindi non puoi partecipare alle sfide." }, { status: 409 });
  }

  if (body.action === "join-challenge") {
    if (!body.challengeId) {
      return Response.json({ error: "Challenge ID richiesto." }, { status: 400 });
    }
    const success = await joinChallenge(body.challengeId, member.id, member.name);
    if (!success) {
      return Response.json({ error: "Sei già iscritto a questa sfida." }, { status: 409 });
    }
    return Response.json({ success: true }, { status: 201 });
  }

  return Response.json({ error: "Azione non riconosciuta." }, { status: 400 });
}
